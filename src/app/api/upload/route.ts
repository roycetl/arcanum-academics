import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import os from "os";
import { db } from "../../../lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const qtyStr = formData.get("quantity") as string;
    const thresholdStr = formData.get("threshold") as string;
    const targetLanguage = formData.get("targetLanguage") as string || "English — English";

    const quantity = parseInt(qtyStr || "5", 10);
    const threshold = parseInt(thresholdStr || "80", 10);
    const safeQuantity = Math.max(quantity, 1); // Allow any positive integer

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save PDF to a temporary file using os.tmpdir()
    const tempFileId = `sacrifice_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
    const tempFilePath = path.join(os.tmpdir(), tempFileId);
    fs.writeFileSync(tempFilePath, buffer);

    console.log(`[Archivist] Uploaded PDF size: ${buffer.length} bytes to temp storage.`);

    // 1. Upload via fileManager natively to bypass 20MB inline limit
    const uploadResult = await ai.files.upload({
      file: tempFilePath,
      config: { mimeType: "application/pdf" },
    });

    console.log(`[Archivist] Google File API connected. URI: ${uploadResult.uri}`);

    // Clean up local temp file as requested so the tent stays clean
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // Wait for the file to become ACTIVE before using it
    if (uploadResult.name) {
      let fileState = uploadResult.state;
      let attempts = 0;
      while (fileState !== "ACTIVE" && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const fileInfo = await ai.files.get({ name: uploadResult.name });
        fileState = fileInfo.state;
        attempts++;
        console.log(`[Archivist] File state: ${fileState} (attempt ${attempts})`);
      }
      if (fileState !== "ACTIVE") {
        throw new Error(`File processing timed out (state: ${fileState}). Try a smaller PDF.`);
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        { text: `Analyze this document. Identify the overarching Subject (e.g. Biology, Math, History, Physics). Then, identify the top ${safeQuantity} distinct Core Concepts. Generate exactly 1 Multiple Choice Question for each concept (total exactly ${safeQuantity} MCQs). Generate all questions and answer options precisely in ${targetLanguage}, regardless of the language of the provided text. Remember: keep technical terms in the source language if there isn't a direct translation, or provide the translation with the original term in parentheses. Assign each question a spellType (Fire, Ice, Holy, Dark, or Grass).` },
        { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } }
      ],
      config: {
        systemInstruction: "You are an Archivist wizard capable of reading any discipline. Classify the discipline and extract pure, conceptual MCQs. Ensure each spell has a spellType attribute.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          description: "Subject classification and extracted spell cards.",
          properties: {
            subject: { type: Type.STRING, description: "The overarching academic subject of the document." },
            spells: {
              type: Type.ARRAY,
              description: `List of exactly ${safeQuantity} multiple choice questions mapped to the top distinct concepts.`,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING },
                  answer: { type: Type.STRING, description: "Correct letter A, B, C, or D" },
                  difficulty: { type: Type.INTEGER, description: "Assign a difficulty scale from 1 (easy baseline) to 5 (extremely complex nuance)." },
                  spellType: { type: Type.STRING, description: "Must be: Fire, Ice, Holy, Dark, or Grass" }
                },
                required: ["question", "A", "B", "C", "D", "answer", "difficulty", "spellType"]
              }
            }
          },
          required: ["subject", "spells"]
        }
      }
    });

    // Optional: Clean up server-side file from Google AI Storage to prevent storage bloat
    try {
      if (uploadResult.name) {
        await ai.files.delete({ name: uploadResult.name });
        console.log(`[Archivist] Deleted Grimoire ${uploadResult.name} from Google Servers.`);
      }
    } catch (err) {
      console.warn("Failed to delete File ID. Let 48Hr TTL execute.");
    }

    const aiText = response.text;
    if (!aiText) throw new Error("No text generated by Gemini");

    const extraction = JSON.parse(aiText);
    const { subject, spells } = extraction;

    // Use os.tmpdir() for state writing to avoid ENOENT errors when Vercel attempts to write outside the root
    try {
      const swarmStatePath = path.join(os.tmpdir(), "state.json");
      let swarmState: any = {};
      if (fs.existsSync(swarmStatePath)) {
        swarmState = JSON.parse(fs.readFileSync(swarmStatePath, 'utf-8'));
      }

      swarmState.status = "battle_active";
      swarmState.subject = subject;
      swarmState.spells = spells;
      swarmState.threshold = threshold;

      fs.writeFileSync(swarmStatePath, JSON.stringify(swarmState, null, 2), 'utf-8');
    } catch (e) {
      console.warn("Could not write local state.json to /tmp, failing over cleanly to Firestore.");
    }

    // Update Firestore to sync Arbiter
    const battleDoc = doc(db, "gameData", "boss");
    await setDoc(battleDoc, {
      status: "battle_active",
      subject: subject,
      spells: spells,
      threshold: threshold,
      playerHp: 100,
      enemyHp: 100,
      maxHp: 100,
      hp: 100,
      playerHand: [],
      activeEffects: {
        fireTurnsLeft: 0,
        iceDefShredActive: false,
        enemyPreparingStrike: false,
        darkWeakenActive: false,
        grassBoostActive: false,
      },
      timestamp: Date.now()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: `The Sacrifice was accepted into the Realm of ${subject}! The Battle has begun!`,
      spellsCount: spells.length,
      subject: subject,
      spells: spells
    });
  } catch (error: any) {
    console.error("[Archivist] Failed to process scroll:", error);

    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("quota")) {
      const match = error.message?.match(/(\d+)\s*sec/i) || error.message?.match(/Wait (\d+)/i);
      const delay = match ? parseInt(match[1], 10) : 60; // Default Google Standard Rate Limit Wait Timeout

      return NextResponse.json(
        {
          error: `The Arcane energies are depleted. Please wait ${delay} seconds for the mana to recharge before offering another sacrifice.`,
          retryDelay: delay
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process the sacrifice", details: error.message },
      { status: 500 }
    );
  }
}

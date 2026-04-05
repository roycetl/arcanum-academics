import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { applySpellEffect, processTurnEffects, GameState, SpellType } from '@/lib/spellLogic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerAnswer, questionIndex } = body;

    // 1. Fetch current game state from Firestore
    const battleDoc = doc(db, "gameData", "boss");
    const battleSnap = await getDoc(battleDoc);
    
    if (!battleSnap.exists()) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    const battleData = battleSnap.data();
    const question = battleData.spells[questionIndex];

    const isCorrect = playerAnswer === question.answer;

    // 2. Fetch or initialize the specific player and enemy states in Firebase
    // For simplicity, we are defaulting them here if they don't exist yet
    let currentState: GameState = {
      playerHp: battleData.playerHp ?? 100,
      enemyHp: battleData.enemyHp ?? 100,
      missedLastQuestion: battleData.missedLastQuestion ?? false,
      activeEffects: battleData.activeEffects ?? { fireTurnsLeft: 0, iceDefShredActive: false, enemyPreparingStrike: false },
      playerHand: battleData.playerHand ?? []
    };

    let battleResult = null;
    let message = "";

    // Process recurring effects first (e.g., burn damage)
    const turnEffects = processTurnEffects(currentState);
    currentState = turnEffects.updatedState;
    message += turnEffects.message;

    const totalQuestions = battleData.spells.length;
    const progress = questionIndex / totalQuestions;
    
    let difficultyTier = 0;
    if (progress >= 0.75) difficultyTier = 3;
    else if (progress >= 0.50) difficultyTier = 2;
    else if (progress >= 0.25) difficultyTier = 1;

    // Apply +10% multiplicatively per tier
    const baseBossDamage = Math.round(20 * Math.pow(1.10, difficultyTier));

    // Unavoidable strike from the previous round failing
    if (currentState.activeEffects.enemyPreparingStrike) {
      if (currentState.activeEffects.darkWeakenActive) {
        const weakenedDamage = Math.floor(baseBossDamage / 2);
        currentState.playerHp -= weakenedDamage;
        currentState.activeEffects.darkWeakenActive = false;
        message += `The Boss strikes... but your Dark magic weakens it! You take only ${weakenedDamage} damage! `;
      } else {
        currentState.playerHp -= baseBossDamage;
        message += `The Boss strikes you for ${baseBossDamage} damage! `;
      }
      currentState.activeEffects.enemyPreparingStrike = false;
    }

    // 3. If correct, draw the spell!
    if (isCorrect) {
      const spellToCast = (question.spellType || 'None') as SpellType; 
      currentState.playerHand!.push(spellToCast);
      message += `You drew a [${spellToCast}] spell card! `;
    } else {
      currentState.activeEffects.enemyPreparingStrike = true;
      message += "Incorrect! The boss prepares to strike! ";
    }

    // Update missed last question to be for the *next* turn
    currentState.missedLastQuestion = !isCorrect;

    // 4. Update Firestore with new HP and Effects so everyone (and the UI) syncs
    await setDoc(battleDoc, {
      playerHp: currentState.playerHp,
      enemyHp: currentState.enemyHp,
      activeEffects: currentState.activeEffects,
      missedLastQuestion: currentState.missedLastQuestion,
      playerHand: currentState.playerHand,
      lastMessage: message
    }, { merge: true });

    return NextResponse.json({
      success: true,
      isCorrect,
      message,
      spellCast: isCorrect ? question.spellType : null,
      newPlayerHp: currentState.playerHp,
      newEnemyHp: currentState.enemyHp,
      effects: currentState.activeEffects
    });

  } catch (error: any) {
    console.error("[Answer API] Failed to process answer:", error);
    return NextResponse.json(
      { error: "Failed to process answer", details: error.message },
      { status: 500 }
    );
  }
}

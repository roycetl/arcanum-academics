import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { applySpellEffect, GameState, SpellType } from '@/lib/spellLogic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spellIndex } = body;

    const battleDoc = doc(db, "gameData", "boss");
    const battleSnap = await getDoc(battleDoc);
    
    if (!battleSnap.exists()) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    const battleData = battleSnap.data();
    
    let currentState: GameState = {
      playerHp: battleData.playerHp ?? 100,
      enemyHp: battleData.enemyHp ?? 100,
      missedLastQuestion: battleData.missedLastQuestion ?? false,
      activeEffects: battleData.activeEffects ?? { fireTurnsLeft: 0, iceDefShredActive: false, enemyPreparingStrike: false, darkWeakenActive: false, grassBoostActive: false },
      playerHand: battleData.playerHand ?? []
    };

    if (!currentState.playerHand || spellIndex < 0 || spellIndex >= currentState.playerHand.length) {
      return NextResponse.json({ error: "Invalid spell index" }, { status: 400 });
    }

    const spellToCast = currentState.playerHand[spellIndex] as SpellType;
    let message = "";

    // Cast the spell
    const battleResult = applySpellEffect(spellToCast, currentState, 20); // Base damage is 20
    currentState = battleResult.updatedState;
    message += battleResult.message;

    // Remove the spell from the hand
    currentState.playerHand!.splice(spellIndex, 1);

    // Note: Casting a spell does not reset/change missedLastQuestion
    // and it does *not* trigger processTurnEffects (answering does).

    // Update Firestore with new HP and Effects so everyone (and the UI) syncs
    await setDoc(battleDoc, {
      playerHp: currentState.playerHp,
      enemyHp: currentState.enemyHp,
      activeEffects: currentState.activeEffects,
      playerHand: currentState.playerHand,
      lastMessage: message
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message,
      spellCast: spellToCast,
      newPlayerHp: currentState.playerHp,
      newEnemyHp: currentState.enemyHp,
      effects: currentState.activeEffects,
      newHand: currentState.playerHand
    });

  } catch (error: any) {
    console.error("[Cast API] Failed to cast spell:", error);
    return NextResponse.json(
      { error: "Failed to cast spell", details: error.message },
      { status: 500 }
    );
  }
}

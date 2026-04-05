export type SpellType = 'Fire' | 'Ice' | 'Holy' | 'Dark' | 'Grass' | 'None';

export interface GameState {
  playerHp: number;
  enemyHp: number;
  missedLastQuestion: boolean;
  activeEffects: {
    fireTurnsLeft: number;
    iceDefShredActive: boolean;
    enemyPreparingStrike: boolean;
    darkWeakenActive?: boolean;
    grassBoostActive?: boolean;
  };
  playerHand?: string[];
}

export interface SpellResult {
  message: string;
  updatedState: GameState;
  damageDealt: number;
}

// 1. Define the mechanics for each spell
export const applySpellEffect = (
  spell: SpellType, 
  currentState: GameState, 
  baseDamage: number
): SpellResult => {
  let damage = baseDamage;
  let message = "";
  let newState = { ...currentState };

  // Apply Ice effect from PREVIOUS turn if active
  if (newState.activeEffects.iceDefShredActive) {
    damage *= 1.5; // 50% damage boost
    newState.activeEffects.iceDefShredActive = false;
    message += "Ice effect triggered! Massive damage! ";
  }

  // Apply Grass effect from PREVIOUS turn if active
  if (newState.activeEffects.grassBoostActive) {
    damage *= 1.5; // 50% damage boost on next attack
    newState.activeEffects.grassBoostActive = false;
    message += "Grass effect triggered! Attack power boosted! ";
  }

  switch (spell) {
    case 'Fire':
      newState.activeEffects.fireTurnsLeft = (newState.activeEffects.fireTurnsLeft || 0) + 3;
      message += `Fireball cast! The enemy is burning for ${newState.activeEffects.fireTurnsLeft} turns.`;
      break;

    case 'Ice':
      newState.activeEffects.iceDefShredActive = true;
      message += "Blizzard cast! The enemy's defense is shredded for the next spell.";
      break;

    case 'Holy':
      if (newState.playerHp < 100) {
        const healAmount = 20;
        newState.playerHp = Math.min(100, newState.playerHp + healAmount);
        message += `Holy light shines! Healed ${healAmount} HP.`;
      } else {
        message += "Holy cast! (No healing needed, you are at max health).";
      }
      break;

    case 'Dark':
      newState.activeEffects.darkWeakenActive = true;
      message += "Dark cast! The enemy's next attack power is halved.";
      break;

    case 'Grass':
      newState.activeEffects.grassBoostActive = true;
      message += "Grass cast! Your next attack power is boosted by 50%.";
      break;

    default:
      message += "Standard attack cast!";
  }

  newState.enemyHp -= damage;

  return {
    message,
    updatedState: newState,
    damageDealt: damage
  };
};

// 2. Logic to process recurring effects (like Fire DoT) at the start of a turn
export const processTurnEffects = (state: GameState): { updatedState: GameState; message: string } => {
  let newState = { ...state };
  let message = "";
  
  if (newState.activeEffects.fireTurnsLeft > 0) {
    newState.enemyHp -= 5; // Static DoT damage
    newState.activeEffects.fireTurnsLeft -= 1;
    message += "🔥 The boss takes 5 damage from burn! ";
  }
  
  return { updatedState: newState, message };
};
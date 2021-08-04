import { Token } from "@bluelibs/core";
import { IMessenger } from "./defs";

export const MESSENGER = new Token<IMessenger>("MESSENGER");
export const IS_LIVE_DEBUG = new Token("IS_LIVE_DEBUG");
export const REDIS_OPTIONS = new Token("REDIS_OPTIONS");
export const X_SETTINGS = new Token();
export const APP_ROUTER = new Token();
export const ROOT_ROUTER = new Token();

export const X_WAY = String.raw`
___   ___      ____    __    ____  ___   ____    ____ 
\  \ /  /      \   \  /  \  /   / /   \  \   \  /   / 
 \  V  /   _____\   \/    \/   / /  ^  \  \   \/   /  
  >   <   |______\            / /  /_\  \  \_    _/   
 /  .  \          \    /\    / /  _____  \   |  |    
/__/ \__\          \__/  \__/ /__/     \__\  |__|  

                  by BlueLibs
`;

// Look, I know they may be cheesy, but who doesn't love cheese?
// Some ideas to bring some fun into our digital lives.
// Feel free to come up with better ones and submit a PR
export const RANDOM_GEEKIE_DEV_QUOTES = [
  "%name%, you are an intellectual badass.",
  "You are in control, %name%.",
  "True code comes from within, %name%.",
  "%name%. It's time: 🕐",
  "%name%. Stay strong & productive",
  "Always test your code, %name%!",
  "May the code you write be SOLID and DRY.",
  "Code is like poetry. You're a poet, %name%!",
  "%name%, shine on you crazy diamond ✨",
  "All is ✅. It's time to 🎸, %name%!",
];

export enum GraphQLSubscriptionEvent {
  ADDED = "added",
  CHANGED = "changed",
  REMOVED = "removed",
  READY = "ready",
}

export enum DocumentMutationType {
  INSERT = "i",
  UPDATE = "u",
  REMOVE = "r",
}

export enum Strategy {
  DEFAULT = "D",
  DEDICATED_CHANNELS = "DC",
  LIMIT_SORT = "LS",
}

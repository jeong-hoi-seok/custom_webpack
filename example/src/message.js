import { upper } from "./util.js";
import suffix from "./suffix.json";

export function greet(who) {
  return "Hello, " + upper(who) + suffix.mark;
}

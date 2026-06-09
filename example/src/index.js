import { greet } from "./message.js";
import { name } from "./name.js";
import "./style.css";

const sentence = greet(name);
console.log(sentence);

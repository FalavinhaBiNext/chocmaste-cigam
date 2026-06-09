import chalk, { ChalkInstance } from "chalk";

function getTime() {
  return new Date().toLocaleString();
}

function formatData(data?: any) {
  if (!data) return "";

  try {
    return chalk.gray(JSON.stringify(data, null, 2));
  } catch {
    return chalk.gray(String(data));
  }
}

function log(
  icon: string,
  label: string,
  color: ChalkInstance,
  message: string,
  data?: any,
) {
  console.log(
    color(`${icon} [${label}] ${getTime()} → ${message}`),
    formatData(data),
  );
}

export const logger = {
  info(message: string, data?: any) {
    log("ℹ️", "INFO", chalk.blue, message, data);
  },

  success(message: string, data?: any) {
    log("✅", "SUCCESS", chalk.green, message, data);
  },

  warn(message: string, data?: any) {
    log("⚠️", "WARNING", chalk.yellow, message, data);
  },

  error(message: string, data?: any) {
    log("❌", "ERROR", chalk.red, message, data);
  },

  danger(message: string, data?: any) {
    log("🔥", "DANGER", chalk.bgRed.white, message, data);
  },

  debug(message: string, data?: any) {
    log("🐞", "DEBUG", chalk.magenta, message, data);
  },

  trace(message: string, data?: any) {
    log("🔎", "TRACE", chalk.gray, message, data);
  },

  request(message: string, data?: any) {
    log("📥", "REQUEST", chalk.cyan, message, data);
  },

  response(message: string, data?: any) {
    log("📤", "RESPONSE", chalk.greenBright, message, data);
  },

  database(message: string, data?: any) {
    log("🗄️", "DATABASE", chalk.blueBright, message, data);
  },

  auth(message: string, data?: any) {
    log("🔐", "AUTH", chalk.hex("#FFA500"), message, data);
  },

  security(message: string, data?: any) {
    log("🛡️", "SECURITY", chalk.bgYellow.black, message, data);
  },

  start(message: string, data?: any) {
    log("🚀", "START", chalk.cyanBright, message, data);
  },

  finish(message: string, data?: any) {
    log("🏁", "FINISH", chalk.green.bold, message, data);
  },

  waiting(message: string, data?: any) {
    log("⏳", "WAITING", chalk.yellowBright, message, data);
  },

  process(message: string, data?: any) {
    log("⚙️", "PROCESS", chalk.whiteBright, message, data);
  },

  route(message: string, data?: any) {
    log("🛣️", "ROUTE", chalk.cyan.bold, message, data);
  },

  api(message: string, data?: any) {
    log("🌐", "API", chalk.blue.bold, message, data);
  },

  cache(message: string, data?: any) {
    log("📦", "CACHE", chalk.greenBright, message, data);
  },

  file(message: string, data?: any) {
    log("📄", "FILE", chalk.white, message, data);
  },

  payment(message: string, data?: any) {
    log("💳", "PAYMENT", chalk.hex("#00B894"), message, data);
  },

  webhook(message: string, data?: any) {
    log("🪝", "WEBHOOK", chalk.hex("#6C5CE7"), message, data);
  },

  email(message: string, data?: any) {
    log("📧", "EMAIL", chalk.hex("#0984E3"), message, data);
  },

  job(message: string, data?: any) {
    log("🧰", "JOB", chalk.hex("#A29BFE"), message, data);
  },

  event(message: string, data?: any) {
    log("📌", "EVENT", chalk.hex("#FAB1A0"), message, data);
  },

  separator(title?: string) {
    const line = "─".repeat(60);

    if (title) {
      console.log(chalk.gray(`\n${line}`));
      console.log(chalk.gray(` ${title}`));
      console.log(chalk.gray(`${line}\n`));
      return;
    }

    console.log(chalk.gray(line));
  },

  table(data: any[]) {
    console.table(data);
  },
};

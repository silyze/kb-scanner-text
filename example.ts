import TextScanner from "./lib";

const scanner = new TextScanner();

async function runScanner() {
  const chunks = await scanner.scan("Hello, World!").transform().toArray();

  console.log(chunks);
}

runScanner().then();

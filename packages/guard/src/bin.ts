#!/usr/bin/env node
import { runGuardCli } from "./cli.js";

process.exitCode = await runGuardCli(process.argv.slice(2));

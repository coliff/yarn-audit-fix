import chalk from 'chalk'
import { join } from 'path'

import { convert, patch } from './flow'
import { TCallback, TContext, TFlags, TFlow, TStage } from './ifaces'
import { getTemp, normalizeFlags, readJson } from './util'

/**
 * Build running context.
 */
export const getContext = (flags: Record<string, any> = {}): TContext => {
  const cwd = process.cwd()
  const manifest = readJson(join(cwd, 'package.json'))
  const temp = getTemp(cwd, flags.temp)
  const ctx = {
    cwd,
    temp,
    flags,
    manifest,
  } as TContext
  ctx.ctx = ctx

  return ctx
}

/**
 * Select `yarn.lock` modification strategy.
 * @param flags
 */
export const getFlow = ({
  flow = 'convert',
}: Record<string, any> = {}): TFlow => {
  if (flow === 'convert') {
    return convert
  }

  if (flow === 'patch') {
    return patch
  }

  throw new Error(`Unsupported flow: ${flow}`)
}

/**
 * Run cmd stack.
 * @param stages
 * @param ctx
 */
export const exec = (stages: TStage[], ctx: TContext): void => {
  for (const [description, ...steps] of stages) {
    !ctx.flags.silent && console.log(chalk.bold(description))

    for (const step of steps) (step as TCallback)(ctx)
  }
}

/**
 * Public static void main.
 */
export const run = async (_flags: TFlags = {}): Promise<void> => {
  const flags = normalizeFlags(_flags)
  const ctx = getContext(flags)
  const flow = getFlow(flags)

  try {
    exec(flow.main, ctx)
  } catch (err) {
    ctx.err = err

    exec(flow.fallback, ctx)

    throw err
  }
}
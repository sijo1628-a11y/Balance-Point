import Dexie, { type EntityTable } from 'dexie'
import { demo, type Data } from './finance'

type Record = { key: string; value: Data }
const db = new Dexie('balancepoint-offline') as Dexie & { workspace: EntityTable<Record, 'key'> }
db.version(1).stores({ workspace: 'key' })
const key = 'workspace'

export async function load(): Promise<Data> {
  const stored = await db.workspace.get(key)
  if (stored) return stored.value
  const seeded = demo()
  await db.workspace.put({ key, value: seeded })
  return seeded
}
export const save = (value: Data) => db.workspace.put({ key, value })
export const erase = () => db.delete()

import {KvsLocalStorage} from "@kvs/node-localstorage";
import {KVSIndexedSchema} from "@kvs/indexeddb";

export interface Lifecycle {
  kv: KvsLocalStorage<KvStorageSchema>
}

export interface KvStorageSchema extends KVSIndexedSchema {

}

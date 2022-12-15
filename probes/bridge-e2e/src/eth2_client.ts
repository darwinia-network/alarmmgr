
export class Eth2Client {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  async get_finalized_header() {
    return await this.get_header('finalized')
  }

  async get_header(id: string) {
    const url = `${this.endpoint}/eth/v1/beacon/headers/${id}`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async get_sync_committee(epoch: string) {
    const url = `${this.endpoint}/eth/v1/beacon/states/finalized/sync_committees?epoch=${epoch}`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async get_beacon_block(id: string) {
    const url = `${this.endpoint}/eth/v2/beacon/blocks/${id}`
    const response = await fetch(url)
    const data = await response.json()
    return data.data.message
  }

  async get_beacon_block_root(id: string) {
    const url = `${this.endpoint}/eth/v1/beacon/blocks/${id}/root`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async get_genesis() {
    const url = `${this.endpoint}/eth/v1/beacon/genesis`
    const response = await fetch(url)
    const data = await response.json()
    return data
  }

  async get_fork_version(id: string) {
    const url = `${this.endpoint}/eth/v1/beacon/states/${id}/fork`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async get_finalized_checkpoint() {
    return this.get_checkpoint('finalized')
  }

  async get_checkpoint(id: string) {
    const url = `${this.endpoint}/eth/v1/beacon/states/${id}/finality_checkpoints`
    const headers = { 'accept': 'application/json' }
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async get_bootstrap(block_root: string) {
    const url = `${this.endpoint}/eth/v1/beacon/light_client/bootstrap/${block_root}`
    const headers = { 'accept': 'application/json' }
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }
}




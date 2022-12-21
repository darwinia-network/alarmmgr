
export class Eth2Client {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  async getFinalizedHeader() {
    return await this.getHeader('finalized')
  }

  async getHeader(id: string) {
    const url = `${this.endpoint}/eth/v1/beacon/headers/${id}`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async getSyncCommittee(epoch: string) {
    const url = `${this.endpoint}/eth/v1/beacon/states/finalized/sync_committees?epoch=${epoch}`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async getBeaconBlock(id: string) {
    const url = `${this.endpoint}/eth/v2/beacon/blocks/${id}`
    const response = await fetch(url)
    const data = await response.json()
    return data.data.message
  }

  async getBeaconBlockRoot(id: string) {
    const url = `${this.endpoint}/eth/v1/beacon/blocks/${id}/root`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async getGenesis() {
    const url = `${this.endpoint}/eth/v1/beacon/genesis`
    const response = await fetch(url)
    const data = await response.json()
    return data
  }

  async getForkVersion(id: string) {
    const url = `${this.endpoint}/eth/v1/beacon/states/${id}/fork`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async getFinalizedCheckpoint() {
    return this.getCheckpoint('finalized')
  }

  async getCheckpoint(id: string) {
    const url = `${this.endpoint}/eth/v1/beacon/states/${id}/finality_checkpoints`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }

  async getBootstrap(blockRoot: string) {
    const url = `${this.endpoint}/eth/v1/beacon/light_client/bootstrap/${blockRoot}`
    const response = await fetch(url)
    const data = await response.json()
    return data.data
  }
}




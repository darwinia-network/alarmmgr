import { EcdsaGraphql } from "../src/graphql"

describe('testing graphql', () => {
  const client = new EcdsaGraphql("https://subql.darwinia.network/subql-bridger-darwinia");
  test('test query latest collecting new messages signatures event', async () => {
    const resp = await client.latestCollectingMessagesSignatures();
    console.log(resp);
  });
  test('test query latest collected new message signatures event', async () => {
    const resp = await client.latestCollectedMessageSignatures();
    console.log(resp);
  });
})

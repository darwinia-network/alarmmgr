import {Subquery} from "../src";



test('test-bridge-s2s-next-on-demand', async () => {
  const subquery = new Subquery('https://subql.darwinia.network/subql-bridger-pangolin?app=alarmmgr');
  // const subquery = new Subquery('http://g3.generic.darwinia.network:11101/subql-bridger-pangolin?app=alarmmgr');
  const ret = await subquery.bridge_s2s().nextOnDemandBlock('bridge-pangoro')
  console.log(ret);
});

test('test-bridge-s2s-next-mandatory', async () => {
  // const subquery = new Subquery('https://subql.darwinia.network/subql-bridger-pangolin');
  const subquery = new Subquery('http://debian:3000');
  const ret = await subquery.bridge_s2s().nextMandatoryBlock(1000)
  console.log(ret);
});

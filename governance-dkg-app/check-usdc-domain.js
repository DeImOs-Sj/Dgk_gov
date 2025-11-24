import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

async function verifyUSDCDomain() {
  try {
    // Call name() function
    const name = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'string' }]
      }],
      functionName: 'name'
    });

    // Call version() function
    const version = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: [{
        name: 'version',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'string' }]
      }],
      functionName: 'version'
    });

    console.log('✅ USDC Contract Domain Parameters:');
    console.log('   Name:', name);
    console.log('   Version:', version);
    console.log('   ChainId:', baseSepolia.id);
    console.log('   Contract:', USDC_ADDRESS);

    // Calculate domain separator
    console.log('\n📋 Use these in EIP-712 domain:');
    console.log(`   name: "${name}"`);
    console.log(`   version: "${version}"`);
    console.log(`   chainId: ${baseSepolia.id}`);
    console.log(`   verifyingContract: "${USDC_ADDRESS}"`);

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyUSDCDomain();

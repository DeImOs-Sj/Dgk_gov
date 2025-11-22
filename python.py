# from dkg.providers import AsyncNodeHTTPProvider, AsyncBlockchainProvider
# from dkg import AsyncDKG
# import asyncio

# async def main():
#     node_provider = AsyncNodeHTTPProvider(
#         endpoint_uri="https://v6-pegasus-node-02.origin-trail.network:8900",
#         api_version="v1",
#     )
#     blockchain_provider = AsyncBlockchainProvider(
#         # "TESTNET",  # e.g., TESTNET
#         # "otp:20430",
#         blockchain_id="otp:20430",
#         rpc_uri="https://otp-testnet.origin-trail.network",
        

#     )
#     dkg = AsyncDKG(node_provider, blockchain_provider)
#     result = await dkg.asset.get("did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/394735")
#     print(result)

# asyncio.run(main())



import asyncio
from dkg.providers import AsyncNodeHTTPProvider, AsyncBlockchainProvider
from dkg import AsyncDKG

# Config for your DKG node
# Use LOCAL node for private resources (they're stored locally)
LOCAL_NODE_URL = "http://localhost:8900"  # Your local DKG node
PEGASUS_NODE_URL = "https://v6-pegasus-node-02.origin-trail.network:8900"  # For public data
BLOCKCHAIN_ID = "otp:20430"
ASSET_UAL = "did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/399695"

async def main():
    # Use Pegasus node for public asset data
    public_node_provider = AsyncNodeHTTPProvider(endpoint_uri=PEGASUS_NODE_URL, api_version="v1")
    blockchain_provider = AsyncBlockchainProvider(
         blockchain_id="otp:20430",
        rpc_uri="https://otp-testnet.origin-trail.network",
    )
    public_dkg = AsyncDKG(public_node_provider, blockchain_provider)

    # Retrieve the public asset
    asset = await public_dkg.asset.get(ASSET_UAL)
    assertions = asset.get("assertion", [])

    # Collect UUIDs of private resources (from representsPrivateResource)
    private_uuids = []
    for assertion in assertions:
        key = "https://ontology.origintrail.io/dkg/1.0#representsPrivateResource"
        if key in assertion:
            for res in assertion[key]:
                private_uuids.append(res["@id"])

    print("Found private resource UUIDs:", private_uuids)

    # Create a LOCAL DKG instance to retrieve private data
    # Private resources are stored locally, not on the public network
    print("\nTrying to connect to local DKG node for private data...")
    try:
        local_node_provider = AsyncNodeHTTPProvider(endpoint_uri=LOCAL_NODE_URL, api_version="v1")
        local_dkg = AsyncDKG(local_node_provider, blockchain_provider)

        # For each UUID, query the private data from LOCAL node
        for uuid in private_uuids:
            try:
                private_data = await local_dkg.asset.get(uuid)
                print(f"\nPrivate data for {uuid}:")
                print(private_data)
            except Exception as e:
                print(f"Error retrieving {uuid} from local node: {e}")
    except Exception as e:
        print(f"Could not connect to local node at {LOCAL_NODE_URL}")
        print(f"Error: {e}")
        print("\nNOTE: Private resources are stored locally on the node that published them.")
        print("You need to:")
        print("1. Start your local DKG node")
        print("2. Ensure it's running on port 8900")
        print("3. Then re-run this script")

asyncio.run(main())

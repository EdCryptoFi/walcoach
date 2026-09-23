# Count blobs created since the hackathon started, using each Blob object's first version timestamp.
import json, urllib.request
OWNER = "0xfb8327183d4abee1ec8ddc73822efcd332e553ea6319f49291a11def4bcb2143"
EP = "https://graphql.mainnet.sui.io/graphql"
cursor, pages, total, since_start = None, 0, 0, 0
START = "2026-09-18"
while True:
    after = f', after: "{cursor}"' if cursor else ""
    q = '{ address(address: "%s") { objects(first: 50%s) { pageInfo { hasNextPage endCursor } nodes { previousTransaction { effects { timestamp } } } } } }' % (OWNER, after)
    req = urllib.request.Request(EP, data=json.dumps({"query": q}).encode(), headers={"content-type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=60))
    if "errors" in d: print("ERR", str(d["errors"])[:200]); break
    o = d["data"]["address"]["objects"]
    for n in o["nodes"]:
        total += 1
        ts = ((n.get("previousTransaction") or {}).get("effects") or {}).get("timestamp")
        if ts and ts[:10] >= START: since_start += 1
    pages += 1
    if not o["pageInfo"]["hasNextPage"] or pages > 60: break
    cursor = o["pageInfo"]["endCursor"]
print(f"blobs total: {total} | last touched on/after {START}: {since_start}")

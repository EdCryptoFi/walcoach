import json, urllib.request
OWNER = "0xfb8327183d4abee1ec8ddc73822efcd332e553ea6319f49291a11def4bcb2143"
EP = "https://graphql.mainnet.sui.io/graphql"
cursor, total, pages, types = None, 0, 0, {}
while True:
    after = f', after: "{cursor}"' if cursor else ""
    q = '{ address(address: "%s") { objects(first: 50%s) { pageInfo { hasNextPage endCursor } nodes { contents { type { repr } } } } } }' % (OWNER, after)
    req = urllib.request.Request(EP, data=json.dumps({"query": q}).encode(), headers={"content-type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=60))
    o = d["data"]["address"]["objects"]
    for n in o["nodes"]:
        t = n["contents"]["type"]["repr"].split("::")[-1]
        types[t] = types.get(t, 0) + 1
        total += 1
    pages += 1
    if not o["pageInfo"]["hasNextPage"] or pages > 60: break
    cursor = o["pageInfo"]["endCursor"]
print("owner:", OWNER)
print("objects:", total, "| by type:", types, "| pages:", pages)

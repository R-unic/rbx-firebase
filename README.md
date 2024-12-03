# @rbxts/firebase
Firebase real-time database wrapper for Roblox
<br>
**Note: Almost every method call makes an HTTP requests. Cache results to avoid going over HTTP request limit as well as optimize performance.** 

## Example
```ts
import { Firebase } from "@rbxts/firebase";

const url = "https://my-default-rtdb.firebaseio.com/";
const auth = "tHiSisAveRYrEaLFiRebAsEAuTHkeY"
const firebase = new Firebase(url, auth);

async function doStuff(): void {
  const runicsCoins = await firebase.get("playerData/44966864/coins");
  print(runicsCoins);

  await firebase.increment("playerData/44966864/coins", 100); // give 100 coins
}
```
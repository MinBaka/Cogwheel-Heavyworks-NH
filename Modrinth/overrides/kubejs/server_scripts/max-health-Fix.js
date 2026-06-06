// 修复登录最大生命值
PlayerEvents.loggedIn(e => {
  let p = e.player;
  let pDATA = "player_HP";

  if (p.persistentData.contains(pDATA)) {
    let 已存储生命值 = p.persistentData.getDouble(pDATA);

    e.server.scheduleInTicks(1, () => {
      if (p && p.isAlive()) {
        p.health = Math.max(已存储生命值, 0);
        p.persistentData.remove(pDATA);
      } else if (p && p.persistentData.contains(pDATA)) {
        p.persistentData.remove(pDATA);
      }
    });
  }
});

// 登出时保存生命值
PlayerEvents.loggedOut(e => {
  let p = e.player;
  let pDATA = "player_HP";

  if (p.isAlive()) {
    p.persistentData.putDouble(pDATA, p.health);
  }
});
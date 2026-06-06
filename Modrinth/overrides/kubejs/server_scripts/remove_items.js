// server_scripts/remove_recipes.js
ServerEvents.recipes(event => {
  const itemsToRemove = [
    'draconicevolution:energy_core',
    'draconicevolution:energy_core_stabilizer',
    'draconicevolution:stabilized_spawner',
    'draconicevolution:generator',
    'draconicevolution:draconic_wireless_crystal',
    'draconicevolution:draconic_io_crystal',
    'draconicevolution:draconic_relay_crystal',
    'draconicevolution:wyvern_io_crystal',
    'draconicevolution:wyvern_relay_crystal',
    'draconicevolution:wyvern_wireless_crystal',
    'draconicevolution:basic_relay_crystal',
    'draconicevolution:basic_io_crystal',
    'draconicevolution:basic_wireless_crystal',
    'enderio:powered_spawner',
    'enderio:soul_vial',
    
  ];

  itemsToRemove.forEach(id => {
    // 移除所有输出为该物品的配方
    event.remove({ output: id });
    // 移除所有输入为该物品的配方（防止作为材料出现）
    event.remove({ input: id });
    // 如果物品有机械动力的序列装配等形式，也可用通配
    event.remove({ mod: 'draconicevolution', output: id });
  });
});
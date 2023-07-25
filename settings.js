export enum TouchMode {
    minitouch = 'minitouch',
    maatouch = 'maatouch',
    adb = 'adb'
}

export enum InstanceOptionKey {
    Invalid = 0,
    // 已弃用 // MinitouchEnabled = 1,   // 是否启用 minitouch
    // 开了也不代表就一定能用，有可能设备不支持等
    // "1" 开，"0" 关
    TouchMode = 2, // 触控模式设置，默认 minitouch
    // minitouch | maatouch | adb
    DeploymentWithPause = 3, // 是否暂停下干员，同时影响抄作业、肉鸽、保全
    // "1" | "0"
}

// 肉鸽主题
export enum RogueTheme {
    Phantom = 'Phantom', // 傀影
    Mizuki = 'Mizuki', // 水月
}
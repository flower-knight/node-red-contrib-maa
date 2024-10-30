// import {koffi} from 'koffi';
// import {os} from 'os';
// import {path} from 'path';
// import {cryoto} from 'cryoto';

// import {existsSync, mkdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync} from 'fs';
// import {ParamType} from './settings';

const koffi = require("koffi");
const os = require("os")
const path = require("path")
const cryoto = require("crypto-js")

const {existsSync, mkdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync} = require('fs');
const {TouchMode, InstanceOptionKey, RogueTheme} = require('./settings.js');


const StringType = "str";
const VoidType = "void";
// const AsstPtrType = koffi.opaque('Concat');
const AsstPtrType = koffi.pointer('AsstPtrType', koffi.opaque());
const BoolType = 'bool';
const IntType = 'int';
const CustomArgsType = 'void *';
const ULLType = 'ulonglong';
const IntPointerType = 'int *';
const Buff = CustomArgsType;
const AsstAsyncCallIdType = IntType;

module.exports = function (RED) {
    const reload = RED.settings.maaReloadTime || 20000;

    // maa配置节点
    function MaaCore(config) {
        // 在NodeRED中创建节点
        const node = this;
        RED.nodes.createNode(node, config);
        // adb地址
        node.adbPath = config.adbPath;
        // maa地址
        node.maaPath = config.maaPath;
        node.libPath = config.maaPath;
        // 依赖库
        node.DepLibs = [];
        // 创建的实例的ID和指针的映射表
        node.MeoAsstPtr = {};
        // 节点是否正在加载
        node.loading = false;
        // 节点是否加载完毕
        node.loaded = false;
        node.libName = {
            win32: 'MaaCore.dll',
            darwin: 'libMaaCore.dylib',
            linux: 'libMaaCore.so',
        }

        async function load() {
            try {
                // 更新节点状态为loading
                node.loading = true;
                node.emit('state', 'loading')
                // 如果没加载过依赖库，则去加载
                if (!node.MeoAsstLib) {
                    // 根据平台加载对应的依赖文件
                    node.DLib = koffi.load(path.join(node.libPath, node.libName[os.platform()]));
                    node.MeoAsstLib = {
                        AsstSetUserDir: node.DLib.func(
                            'AsstSetUserDir',
                            BoolType,
                            [StringType],
                        ),

                        AsstLoadResource: node.DLib.func(
                            'AsstLoadResource',
                            BoolType,
                            [StringType],
                        ),

                        AsstSetStaticOption: node.DLib.func(
                            'AsstSetStaticOption',
                            BoolType,
                            [IntType, StringType],
                        ),

                        AsstCreate: node.DLib.func(
                            'AsstCreate',
                            AsstPtrType,
                            [],
                        ),

                        // AsstCreateEx: node.DLib.func(
                        //     'AsstCreateEx',
                        //     AsstPtrType,
                        //     ['pointer', CustomArgsType],
                        // ),

                        AsstDestroy: node.DLib.func(
                            'AsstDestroy',
                            VoidType,
                            [AsstPtrType],
                        ),

                        AsstSetInstanceOption: node.DLib.func(
                            'AsstSetInstanceOption',
                            BoolType,
                            [AsstPtrType, IntType, StringType],
                        ),

                        AsstConnect: node.DLib.func(
                            'AsstConnect',
                            BoolType,
                            [AsstPtrType, StringType, StringType, StringType],
                        ),

                        AsstAppendTask: node.DLib.func(
                            'AsstAppendTask',
                            IntType,
                            [AsstPtrType, StringType, StringType],
                        ),

                        AsstSetTaskParams: node.DLib.func(
                            'AsstSetTaskParams',
                            BoolType,
                            [AsstPtrType, IntType, StringType],
                        ),

                        AsstStart: node.DLib.func(
                            'AsstStart',
                            BoolType,
                            [AsstPtrType],
                        ),

                        AsstStop: node.DLib.func(
                            'AsstStop',
                            BoolType,
                            [AsstPtrType],
                        ),

                        AsstRunning: node.DLib.func(
                            'AsstRunning',
                            BoolType,
                            [AsstPtrType],
                        ),

                        AsstAsyncConnect: node.DLib.func(
                            'AsstAsyncConnect',
                            AsstAsyncCallIdType,
                            [AsstPtrType, StringType, StringType, StringType, BoolType],
                        ),

                        AsstAsyncClick: node.DLib.func(
                            'AsstAsyncClick',
                            AsstAsyncCallIdType,
                            [AsstPtrType, IntType, IntType, BoolType],
                        ),

                        AsstAsyncScreenCap: node.DLib.func(
                            'AsstAsyncScreencap',
                            AsstAsyncCallIdType,
                            [AsstPtrType, BoolType],
                        ),

                        AsstGetImage: node.DLib.func(
                            'AsstGetImage',
                            ULLType,
                            [AsstPtrType, Buff, ULLType],
                        ),

                        AsstGetUUID: node.DLib.func(
                            'AsstGetUUID',
                            ULLType,
                            [AsstPtrType, StringType, ULLType],
                        ),

                        AsstGetTasksList: node.DLib.func(
                            'AsstGetTasksList',
                            ULLType,
                            [AsstPtrType, IntPointerType, ULLType],
                        ),

                        AsstGetNullSize: node.DLib.func(
                            'AsstGetNullSize',
                            ULLType,
                            [],
                        ),

                        AsstGetVersion: node.DLib.func(
                            'AsstGetVersion',
                            StringType,
                            []
                        ),

                        AsstLog: node.DLib.func(
                            'AsstLog',
                            VoidType,
                            [StringType, StringType],
                        )
                    }
                }
                // 更新节点状态为loaded
                node.loading = false;
                node.loaded = true;
                if (await stateCheck()) {
                    node.emit("state", "loaded");
                    if (!node.check) {
                        node.check = setInterval(stateCheck, 290000);
                    }
                } else {
                    node.error("maaCore load failed")
                    node.status({fill: "red", shape: "ring", text: RED._("maaCore.status.loadFailed")});
                    node.tick = setTimeout(load, reload)
                }
            } catch (err) {
                node.error(err)
                node.status({fill: "red", shape: "ring", text: RED._("maaCore.status.loadFailed")});
            }
        }

        // 节点初始化
        node.load = function () {
            if (!node.loaded && !node.loading) {
                load();
            }
        }

        // 节点关闭
        node.on('close', function (done) {
            if (node.tick) {
                clearTimeout(node.tick);
            }
            if (node.check) {
                clearInterval(node.check);
            }
            // node.connection.release();
            node.emit("state", " ");
            if (node.loaded) {
                node.loaded = false;
                Destroy();
                done();
            } else {
                Destroy();
                done();
            }

        });

        /**
         * 异步调用的状态检查
         * @returns {Promise<unknown>}
         */
        async function stateCheck() {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const version = node.GetCoreVersion()
                    if (version) {
                        resolve(version)
                    } else {
                        reject(null)
                    }
                })
            })

        }

        /**
         * 指定资源路径
         * @param path 未指定就用libPath
         * @returns String 加载成功的信息
         */
        node.LoadResource = function (path) {
            if (!existsSync(path)) {
                return false
            }
            return node.MeoAsstLib.AsstLoadResource(path ?? node.libPath)
        }

        /**
         * 创建普通实例, 即无回调版
         * @param uuid ip加端口加密后的字符串
         * @returns boolean
         */
        node.Create = function (uuid) {
            // node.MeoAsstPtr.placeholder = node.MeoAsstLib.AsstCreate()
            // return !!node.MeoAsstPtr.placeholder
            if (!node.MeoAsstPtr[uuid]) {
                node.MeoAsstPtr[uuid] = node.MeoAsstLib.AsstCreate()
                return true
            }
            return false
        }

        // /**
        //  * @description 创建实例
        //  * @param uuid 设备唯一标识符
        //  * @param callback 回调函数
        //  * @param customArg 自定义参数{???}
        //  * @returns  是否创建成功
        //  */
        // node.CreateEx = function (
        //     uuid,
        //     callback = callbackHandle,
        //     customArg = createVoidPointer()
        // ) {
        //     if (!node.MeoAsstPtr[uuid]) {
        //         node.MeoAsstPtr[uuid] = node.MeoAsstLib.AsstCreateEx(callback, customArg)
        //         return true
        //     }
        //     return false
        // }

        /**
         * @description 摧毁实例
         * @param uuid 设备唯一标识符
         */
        function Destroy(uuid) {
            if (node.MeoAsstPtr[uuid]) {
                node.MeoAsstLib.AsstDestroy(node.MeoAsstPtr[uuid])
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete node.MeoAsstPtr[uuid]
            }
        }

        /** @deprecated 已废弃，将在接下来的版本中移除 */
        node.Connect = function (uuid, adbPath, address, config) {
            return node.MeoAsstLib.AsstConnect(node.MeoAsstPtr[uuid], adbPath, address, config)
        }

        /**
         * @description 连接
         * @param address 连接地址
         * @param uuid 设备唯一标识符
         * @param adbPath adb路径
         * @param config 模拟器名称, 自定义设备为'General'
         * @param block 是否阻塞
         * @returns 是否连接成功
         */
        node.AsyncConnect = function (uuid, adbPath, address, config, block = false) {
            return node.MeoAsstLib.AsstAsyncConnect(node.MeoAsstPtr[uuid], adbPath, address, config, block)
        }

        /**
         * 添加任务
         * @param uuid 设备唯一标识符
         * @param type 任务类型, 详见文档
         * @param params 任务json字符串, 详见文档
         * @returns
         */
        node.AppendTask = function (uuid, type, params) {
            return node.MeoAsstLib.AsstAppendTask(node.GetCoreInstanceByUUID(uuid), type, params)
        }

        /**
         * 设置任务参数
         * @param uuid 设备唯一标识符
         * @param taskId 任务唯一id
         * @param params 任务参数
         */

        node.SetTaskParams = function (uuid, taskId, params) {
            return node.MeoAsstLib.AsstSetTaskParams(
                node.GetCoreInstanceByUUID(uuid),
                taskId,
                params
            )
        }

        /**
         * 开始任务
         * @param uuid 设备唯一标识符
         * @returns 是否成功
         */
        node.Start = function (uuid) {
            return node.MeoAsstLib.AsstStart(node.GetCoreInstanceByUUID(uuid))
        }

        /**
         * 停止并清空所有任务
         * @param uuid 设备唯一标识符
         * @returns
         */
        node.Stop = function (uuid) {
            return node.MeoAsstLib.AsstStop(node.GetCoreInstanceByUUID(uuid))
        }

        /**
         * @description 摧毁实例
         * @param uuid 设备唯一标识符
         * @returns
         */
        node.Destroy = function (uuid) {
            if (node.MeoAsstPtr[uuid]) {
                node.MeoAsstLib.AsstDestroy(node.MeoAsstPtr[uuid])
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete node.MeoAsstPtr[uuid]
            }
        }

        /**
         * 发送点击
         * @param uuid 设备唯一标识符
         * @param x x坐标
         * @param y y坐标
         * @returns
         */
        node.Click = function (uuid, x, y) {
            return node.MeoAsstLib.AsstClick(node.GetCoreInstanceByUUID(uuid), x, y)
        }

        /**
         * 异步请求截图, 在回调中取得截图完成事件后再使用GetImage获取截图
         * @param uuid
         * @param block 阻塞
         * @returns
         */
        function AsyncScreenCap(uuid, block = true) {
            if (!node.MeoAsstPtr[uuid]) return false
            return node.MeoAsstLib.AsstAsyncScreenCap(node.GetCoreInstanceByUUID(uuid), block)
        }

        function GetImage(uuid) {
            const buf = Buffer.alloc(5114514)
            // const len = node.MeoAsstLib.AsstGetImage(GetCoreInstanceByUUID(uuid), buf as any, buf.length)
            // const buf2 = buf.slice(0, len as number)
            const len = node.MeoAsstLib.AsstGetImage(node.GetCoreInstanceByUUID(uuid), buf, buf.length)
            const buf2 = buf.slice(0, Number(len))
            const v2 = buf2.toString('base64')
            return v2
        }

        /**
         * @description Maa的版本信息
         * @returns string
         */
        node.GetCoreVersion = function () {
            if (!node.loaded) {
                return '';
            }
            return node.MeoAsstLib.AsstGetVersion()
        }

        node.GetCoreInstanceByUUID = function (uuid) {
            return node.MeoAsstPtr[uuid]
        }

        function Log(level, message) {
            return node.MeoAsstLib.AsstLog(level, message)
        }

        node.SetInstanceOption = function (uuid, key, value) {
            return node.MeoAsstLib.AsstSetInstanceOption(node.GetCoreInstanceByUUID(uuid), key, value)
        }

        node.SetTouchMode = function (uuid, mode) {
            if (!node.MeoAsstPtr[uuid]) {
                return false
            }
            return node.SetInstanceOption(uuid, InstanceOptionKey.TouchMode, mode)
        }

        /**
         * @description change touch mode for all instances
         * @param mode TouchMode
         * @returns is all changes success
         */
        function ChangeTouchMode(mode) {
            for (const uuid in node.MeoAsstPtr) {
                if (node.MeoAsstPtr[uuid]) {
                    const status = node.SetTouchMode(uuid, mode)
                    if (!status) {
                        // logger.error(`Change touch mode failed on uuid: ${uuid}`)
                        return status
                    }
                }
            }
            return true
        }
    }

    // 注册 maaCore 节点
    RED.nodes.registerType("maaCore", MaaCore, {
        defaults: {
            maaPath: {value: ""},
            adbPath: {value: "", required: true}
        }
    });

    // maa节点
    function Maa(config) {
        // 在NodeRED中创建节点
        const node = this;
        RED.nodes.createNode(node, config);
        // 加载配置节点maaCore
        node.maaCore = RED.nodes.getNode(config.maaCore);
        node.status({});

        //
        if (node.maaCore) {
            node.maaCore.load();
            let busy = false;
            let status = {};
            node.maaCore.on("state", function (info) {
                if (info === "loading") {
                    // maaCore加载中，灰圈
                    node.status({fill: "grey", shape: "ring", text: info});
                } else if (info === "loaded") {
                    // maaCore已加载，绿点
                    node.status({fill: "green", shape: "dot", text: info});
                } else {
                    // maaCore加载失败，红圈
                    node.status({fill: "red", shape: "ring", text: info});
                }
            });

            // maa节点被输入时触发
            node.on("input", function (msg, send, done) {
                send = send || function () {
                    node.send.apply(node, arguments)
                };
                // 判断maaCore是否是已加载状态
                if (node.maaCore.loaded) {
                    if (typeof msg.topic === 'string') {
                        console.log("action:", msg.topic);
                        switch (msg.topic) {
                            case "Version":
                                msg.payload = node.maaCore.GetCoreVersion();
                                send(msg);
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "LoadResource":
                                let maaPath = msg.payload.maaPath
                                msg.payload = node.maaCore.LoadResource(maaPath)
                                send(msg)
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "Create":
                                const uuid = cryoto.SHA256(msg.payload.address);
                                const flag = node.maaCore.Create(uuid);
                                msg.payload = {"uuid": uuid, "flag": flag}
                                send(msg)
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            // case "CreateEx":
                            //     const uuid1 = sha_sum.update(msg.payload.address).digest('hex');
                            //     const flag1 = node.maaCore.CreateEx(uuid1);
                            //     msg.payload = {"uuid": uuid1, "flag": flag1}
                            //     send(msg)
                            //     status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                            //     break;
                            case "Connect":
                                msg.payload = node.maaCore.Connect(
                                    msg.payload.uuid,
                                    msg.payload.adbPath,
                                    msg.payload.address,
                                    msg.payload.config
                                );
                                send(msg);
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "SetTouchMode":
                                msg.payload = node.maaCore.SetTouchMode(
                                    msg.payload.uuid,
                                    msg.payload.mode,
                                );
                                send(msg);
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "AppendTask":
                                const taskType = msg.payload.type;
                                const taskId = node.maaCore.AppendTask(
                                    msg.payload.uuid,
                                    msg.payload.type,
                                    msg.payload.params
                                );
                                msg.payload = {
                                    taskId: taskId,
                                    taskType: taskType,
                                }
                                send(msg);
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "Start":
                                msg.payload = node.maaCore.Start(
                                    msg.payload.uuid
                                );
                                send(msg);
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "Stop":
                                msg.payload = node.maaCore.Stop(
                                    msg.payload.uuid
                                );
                                send(msg);

                                break;
                            case "Dispose":
                                if (!node.maaCore.loaded) {
                                    msg.payload = "core already dispose, ignore..."
                                    send(msg)
                                    status = {fill: "red", shape: "ring", text: RED._("maa.status.notconnected")};
                                    return
                                }
                                for (const uuid of Object.keys(node.maaCore.MeoAsstPtr)) {
                                    node.maaCore.Stop(uuid)
                                    node.maaCore.Destroy(uuid)
                                }
                                try {
                                    node.maaCore.DLib.close()
                                } catch (e) {
                                }
                                for (const dep of node.maaCore.DepLibs) {
                                    dep.close()
                                }
                                node.maaCore.loaded = false
                                msg.payload = "core has been disposed"
                                send(msg)
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            default:
                                msg.payload = RED._("maa.error.notMethod");
                                send(msg)
                                status = {fill: "red", shape: "ring", text: RED._("maa.status.error")};
                                break;
                        }
                        node.status(status);
                    } else {
                        node.error("msg.topic : " + RED._("maa.errors.notString"));
                        done();
                    }
                } else {
                    node.error(RED._("maa.errors.notLoaded"), msg);
                    status = {fill: "red", shape: "ring", text: RED._("maa.status.notLoaded")};
                    if (done) {
                        done();
                    }
                }

                // 将maa节点的状态更新到画布
                if (!busy) {
                    busy = true;
                    node.status(status);
                    node.tout = setTimeout(function () {
                        busy = false;
                        node.status(status);
                    }, 500);
                }
            });

            // maa节点被关闭时触发
            node.on('close', function () {
                if (node.tout) {
                    clearTimeout(node.tout);
                }
                node.maaCore.removeAllListeners();
                node.status({});
            });
        } else {
            node.error(RED._("maa.errors.notConfigured"));
        }
    }

    // 注册 Maa 节点
    RED.nodes.registerType("maa", Maa);
}
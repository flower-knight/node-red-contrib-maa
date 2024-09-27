const ffi = require("@tigerconnect/ffi-napi")
const ref = require("@tigerconnect/ref-napi")
const path = require("path");
const cryoto = require("crypto")
const {existsSync, mkdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync} = require("fs")
const {TouchMode, InstanceOptionKey, RogueTheme} = require("./settings.js");
// const {TouchMode} = require("./settings");
// const callbackHandle = require("./callback")
/*import ffi, {DynamicLibrary} from "@tigerconnect/ffi-napi";
import ref from "@tigerconnect/ref-napi"
import * as path from "path";
import callbackHandle from './callback'
// import { InstanceOptionKey } from '@main/../common/enum/core'
import {TouchMode} from './settings'*/

/** Some types for core */
const BoolType = ref.types.bool
const IntType = ref.types.int
const AsstAsyncCallIdType = ref.types.int
// const AsstBoolType = ref.types.uint8
// const IntArrayType = ArrayType(IntType)
// const DoubleType = ref.types.double
const ULLType = ref.types.ulonglong
const VoidType = ref.types.void
const StringType = ref.types.CString
// const StringPtrType = ref.refType(StringType)
// const StringPtrArrayType = ArrayType(StringType)
const AsstType = ref.types.void
const AsstPtrType = ref.refType(AsstType)
// const TaskPtrType = ref.refType(AsstType)
const CustomArgsType = ref.refType(ref.types.void)
const IntPointerType = ref.refType(IntType)
const Buff = CustomArgsType

const callbackHandle = ffi.Callback(
    'void',
    ['int', 'string', ref.refType(ref.types.void)],
    (code, data, customArgs) => {
        // logger.silly(code)
        // logger.silly(data)
        ipcMainSend('renderer.CoreLoader:callback', {
            code,
            data: JSON.parse(data)
            // customArgs
        })
    }
)

function createVoidPointer() {
    return ref.alloc(ref.types.void)
}


module.exports = function (RED) {
    var reload = RED.settings.maaReloadTime || 20000;

    function MaaNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.adbPath = config.adbPath
        this.maaPath = config.maaPath
        // this.host = config.host
        this.libPath = config.maaPath
        this.DepLibs = []
        this.MeoAsstPtr = {}
        this.loading = false;
        this.loaded = false;
        this.dependences = {
            win32: ['opencv_world4_maa.dll', 'onnxruntime_maa.dll', 'MaaDerpLearning.dll'],
            linux: ['libopencv_world4.so.407', 'libonnxruntime.so.1.14.1', 'libMaaDerpLearning.so'],
            darwin: ['libopencv_world4.dylib', 'libonnxruntime.dylib', 'libMaaDerpLearning.dylib'],
        }
        this.libName = {
            win32: 'MaaCore.dll',
            darwin: 'libMaaCore.dylib',
            linux: 'libMaaCore.so',
        }


        async function load() {
            try {
                node.loading = true;
                node.emit("state", "loading")
                if (!node.MeoAsstLib) {
                    node.dependences[process.platform].forEach((lib) => {
                        node.DepLibs.push(ffi.DynamicLibrary(path.join(node.libPath, lib)))
                    })
                    node.DLib = ffi.DynamicLibrary(path.join(node.libPath, node.libName[process.platform]), ffi.RTLD_NOW)
                    node.MeoAsstLib = {
                        AsstSetUserDir: ffi.ForeignFunction(node.DLib.get('AsstSetUserDir'),
                            BoolType,
                            [StringType],
                            ffi.FFI_STDCALL),

                        AsstLoadResource: ffi.ForeignFunction(node.DLib.get('AsstLoadResource'),
                            BoolType,
                            [StringType],
                            ffi.FFI_STDCALL),

                        AsstSetStaticOption: ffi.ForeignFunction(node.DLib.get('AsstSetStaticOption'),
                            BoolType,
                            [IntType, StringType],
                            ffi.FFI_STDCALL),

                        AsstCreate: ffi.ForeignFunction(node.DLib.get('AsstCreate'),
                            AsstPtrType,
                            [],
                            ffi.FFI_STDCALL),

                        AsstCreateEx: ffi.ForeignFunction(node.DLib.get('AsstCreateEx'),
                            AsstPtrType,
                            ['pointer', CustomArgsType],
                            ffi.FFI_STDCALL),

                        AsstDestroy: ffi.ForeignFunction(node.DLib.get('AsstDestroy'),
                            VoidType,
                            [AsstPtrType],
                            ffi.FFI_STDCALL),

                        AsstSetInstanceOption: ffi.ForeignFunction(node.DLib.get('AsstSetInstanceOption'),
                            BoolType,
                            [AsstPtrType, IntType, StringType],
                            ffi.FFI_STDCALL),

                        AsstConnect: ffi.ForeignFunction(node.DLib.get('AsstConnect'),
                            BoolType,
                            [AsstPtrType, StringType, StringType, StringType],
                            ffi.FFI_STDCALL),

                        AsstAppendTask: ffi.ForeignFunction(node.DLib.get('AsstAppendTask'),
                            IntType,
                            [AsstPtrType, StringType, StringType],
                            ffi.FFI_STDCALL),

                        AsstSetTaskParams: ffi.ForeignFunction(node.DLib.get('AsstSetTaskParams'),
                            BoolType,
                            [AsstPtrType, IntType, StringType],
                            ffi.FFI_STDCALL),

                        AsstStart: ffi.ForeignFunction(node.DLib.get('AsstStart'),
                            BoolType,
                            [AsstPtrType],
                            ffi.FFI_STDCALL),

                        AsstStop: ffi.ForeignFunction(node.DLib.get('AsstStop'),
                            BoolType,
                            [AsstPtrType],
                            ffi.FFI_STDCALL),

                        AsstRunning: ffi.ForeignFunction(node.DLib.get('AsstRunning'),
                            BoolType,
                            [AsstPtrType],
                            ffi.FFI_STDCALL),

                        AsstAsyncConnect: ffi.ForeignFunction(node.DLib.get('AsstAsyncConnect'),
                            AsstAsyncCallIdType,
                            [AsstPtrType, StringType, StringType, StringType, BoolType],
                            ffi.FFI_STDCALL),

                        AsstAsyncClick: ffi.ForeignFunction(node.DLib.get('AsstAsyncClick'),
                            AsstAsyncCallIdType,
                            [AsstPtrType, IntType, IntType, BoolType],
                            ffi.FFI_STDCALL),

                        AsstAsyncScreenCap: ffi.ForeignFunction(node.DLib.get('AsstAsyncScreencap'),
                            AsstAsyncCallIdType,
                            [AsstPtrType, BoolType],
                            ffi.FFI_STDCALL),

                        AsstGetImage: ffi.ForeignFunction(node.DLib.get('AsstGetImage'),
                            ULLType,
                            [AsstPtrType, Buff, ULLType],
                            ffi.FFI_STDCALL),

                        AsstGetUUID: ffi.ForeignFunction(node.DLib.get('AsstGetUUID'),
                            ULLType,
                            [AsstPtrType, StringType, ULLType],
                            ffi.FFI_STDCALL),

                        AsstGetTasksList: ffi.ForeignFunction(node.DLib.get('AsstGetTasksList'),
                            ULLType,
                            [AsstPtrType, IntPointerType, ULLType],
                            ffi.FFI_STDCALL),

                        AsstGetNullSize: ffi.ForeignFunction(node.DLib.get('AsstGetNullSize'),
                            ULLType,
                            [],
                            ffi.FFI_STDCALL),

                        AsstGetVersion: ffi.ForeignFunction(node.DLib.get('AsstGetVersion'),
                            StringType,
                            [],
                            ffi.FFI_STDCALL),

                        AsstLog: ffi.ForeignFunction(node.DLib.get('AsstLog'),
                            VoidType,
                            [StringType, StringType],
                            ffi.FFI_STDCALL)
                    }
                }
                node.loading = false;
                node.loaded = true;
                if (await stateCheck()) {
                    node.emit("state", "loaded");
                    if (!node.check) {
                        node.check = setInterval(stateCheck, 290000);
                    }
                } else {
                    node.error("maaCore load failed")
                    node.status({fill: "red", shape: "ring", text: RED._("maaCore.status.badping")});
                    node.tick = setTimeout(load, reload)
                }
            } catch (err) {
                node.error(err)
                node.status({fill: "red", shape: "ring", text: RED._("maaCore.status.badping")});
                // node.dispose()
            }
        }

        node.load = function () {
            if (!node.loaded && !node.loading) {
                load();
            }
        }

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
         * 一个异步调用
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
         * @param path? 未指定就用libPath
         * @returns
         */
        node.LoadResource = function (path) {
            if (!existsSync(path)) {
                return false
            }
            return node.MeoAsstLib.AsstLoadResource(path ?? node.libPath)
        }

        /**
         * 创建普通实例, 即无回调版
         * @returns 实例指针{ref.Pointer}
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

        /**
         * @description 创建实例
         * @param uuid 设备唯一标识符
         * @param callback 回调函数
         * @param customArg 自定义参数{???}
         * @returns  是否创建成功
         */
        node.CreateEx = function (
            uuid,
            callback = callbackHandle,
            customArg = createVoidPointer()
        ) {
            if (!node.MeoAsstPtr[uuid]) {
                node.MeoAsstPtr[uuid] = node.MeoAsstLib.AsstCreateEx(callback, customArg)
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
        // function CreateEx(
        //     uuid,
        //     callback = callbackHandle,
        //     customArg = createVoidPointer()
        // ) {
        //     if (!node.MeoAsstPtr[uuid]) {
        //         node.MeoAsstPtr[uuid] = node.MeoAsstLib.AsstCreateEx(callback, customArg)
        //         return true
        //     }
        //     return false // 重复创建
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
         * @description core版本
         * @returns 版本
         */
        node.GetCoreVersion = function () {
            if (!node.loaded) return null
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

    RED.nodes.registerType("maaCore", MaaNode, {
        defaults: {
            maaPath: {value: ""},
            adbPath: {value: "", required: true}
            // port: {value:"5555",required:true}
        }
        // credentials: {
        //     user: {type: "text"},
        //     password: {type: "password"}
        // }
    });

    function MaaNodeIn(config) {
        RED.nodes.createNode(this, config);
        this.maaCore = config.maaCore;
        this.maaCoreConfig = RED.nodes.getNode(this.maaCore);
        // let instance =this.maaCoreConfig.MeoAsstLib
        this.status({});

        if (this.maaCoreConfig) {
            this.maaCoreConfig.load();
            let sha_sum = cryoto.createHash('sha1')
            let node = this;
            let busy = false;
            let status = {};
            node.maaCoreConfig.on("state", function (info) {
                if (info === "loading") {
                    node.status({fill: "grey", shape: "ring", text: info});
                } else if (info === "loaded") {
                    node.status({fill: "green", shape: "dot", text: info});
                } else {
                    node.status({fill: "red", shape: "ring", text: info});
                }
            });

            node.on("input", function (msg, send, done) {
                send = send || function () {
                    node.send.apply(node, arguments)
                };
                if (node.maaCoreConfig.loaded) {
                    if (typeof msg.topic === 'string') {
                        console.log("action:", msg.topic);
                        switch (msg.topic) {
                            case "Version":
                                msg.payload = node.maaCoreConfig.GetCoreVersion();
                                send(msg);
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "LoadResource":
                                let maaPath = msg.payload.maaPath
                                msg.payload = node.maaCoreConfig.LoadResource(maaPath)
                                send(msg)
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "Create":
                                const uuid = sha_sum.update(msg.payload.address).digest('hex');
                                const flag = node.maaCoreConfig.Create(uuid);
                                msg.payload = {"uuid": uuid, "flag": flag}
                                send(msg)
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "CreateEx":
                                const uuid1 = sha_sum.update(msg.payload.address).digest('hex');
                                const flag1 = node.maaCoreConfig.CreateEx(uuid1);
                                msg.payload = {"uuid": uuid1, "flag": flag1}
                                send(msg)
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "Connect":
                                msg.payload = node.maaCoreConfig.Connect(
                                    msg.payload.uuid,
                                    msg.payload.adbPath,
                                    msg.payload.address,
                                    msg.payload.config
                                );
                                send(msg);
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "SetTouchMode":
                                msg.payload = node.maaCoreConfig.SetTouchMode(
                                    msg.payload.uuid,
                                    msg.payload.mode,
                                );
                                send(msg);
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "AppendTask":
                                const taskType = msg.payload.type;
                                const taskId = node.maaCoreConfig.AppendTask(
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
                                msg.payload = node.maaCoreConfig.Start(
                                    msg.payload.uuid
                                );
                                send(msg);
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            case "Stop":
                                msg.payload = node.maaCoreConfig.Stop(
                                    msg.payload.uuid
                                );
                                send(msg);

                                break;
                            case "Dispose":
                                if (!node.maaCoreConfig.loaded) {
                                    msg.payload = "core already dispose, ignore..."
                                    send(msg)
                                    status = {fill: "red", shape: "ring", text: RED._("maa.status.notconnected")};
                                    return
                                }
                                for (const uuid of Object.keys(node.maaCoreConfig.MeoAsstPtr)) {
                                    node.maaCoreConfig.Stop(uuid)
                                    node.maaCoreConfig.Destroy(uuid)
                                }
                                try {
                                    node.maaCoreConfig.DLib.close()
                                } catch (e) {
                                }
                                for (const dep of node.maaCoreConfig.DepLibs) {
                                    dep.close()
                                }
                                node.maaCoreConfig.loaded = false
                                msg.payload = "core has been disposed"
                                send(msg)
                                status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                                break;
                            default:
                                msg.payload = "This method does not exist"
                                send(msg)
                                status = {fill: "red", shape: "ring", text: RED._("maa.status.notconnected")};
                                break;
                        }
                        node.status(status);
                        // node.maaCoreConfig.pool.getConnection(function (err, conn) {
                        //     if (err) {
                        //         if (conn) {
                        //             conn.release()
                        //         }
                        //         status = {
                        //             fill: "red",
                        //             shape: "ring",
                        //             text: RED._("maa.status.error") + ": " + err.code
                        //         };
                        //         node.status(status);
                        //         node.error(err, msg);
                        //         if (done) {
                        //             done();
                        //         }
                        //         return
                        //     }
                        //
                        //     var bind = [];
                        //     if (Array.isArray(msg.payload)) {
                        //         bind = msg.payload;
                        //     } else if (typeof msg.payload === 'object' && msg.payload !== null) {
                        //         bind = msg.payload;
                        //     }
                        //     conn.config.queryFormat = Array.isArray(msg.payload) ? null : customQueryFormat
                        //     conn.query(msg.topic, bind, function (err, rows) {
                        //         conn.release()
                        //         if (err) {
                        //             status = {
                        //                 fill: "red",
                        //                 shape: "ring",
                        //                 text: RED._("maa.status.error") + ": " + err.code
                        //             };
                        //             node.status(status);
                        //             node.error(err, msg);
                        //         } else {
                        //             msg.payload = rows;
                        //             send(msg);
                        //             status = {fill: "green", shape: "dot", text: RED._("maa.status.ok")};
                        //             node.status(status);
                        //         }
                        //         if (done) {
                        //             done();
                        //         }
                        //     });
                        // })

                    } else {
                        if (typeof msg.topic !== 'string') {
                            node.error("msg.topic : " + RED._("maa.errors.notstring"));
                            done();
                        }
                    }
                } else {
                    node.error(RED._("maa.errors.notconnected"), msg);
                    status = {fill: "red", shape: "ring", text: RED._("maa.status.notconnected")};
                    if (done) {
                        done();
                    }
                }
                if (!busy) {
                    busy = true;
                    node.status(status);
                    node.tout = setTimeout(function () {
                        busy = false;
                        node.status(status);
                    }, 500);
                }
            });

            node.on('close', function () {
                if (node.tout) {
                    clearTimeout(node.tout);
                }
                node.maaCoreConfig.removeAllListeners();
                node.status({});
            });
        } else {
            this.error(RED._("maa.errors.notconfigured"));
        }
    }

    RED.nodes.registerType("maa", MaaNodeIn);


}

import ffi, {DynamicLibrary} from "@tigerconnect/ffi-napi";
import ref from "@tigerconnect/ref-napi"
import * as path from "path";
import callbackHandle from './callback'
// import { InstanceOptionKey } from '@main/../common/enum/core'
import {InstanceOptionKey} from './settings'
import {TouchMode} from './settings'

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
type AsstInstancePtr = ref.Pointer<void>

function createVoidPointer(): ref.Value<void> {
    return ref.alloc(ref.types.void)
}


module.exports = function (RED) {
    var reconnect = RED.settings.mysqlReconnectTime || 20000;

    function MaaNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.adbPath = config.adbPath
        this.maaPath = config.maaPath
        this.host = config.host
        this.libPath = config.libPath
        this.DepLibs = []
        this.MeoAsstPtr = {}
        this.connecting = false;
        this.connected = false;
        this.dependences = {
            win32: [
                'opencv_world4_maa.dll',
                'onnxruntime_maa.dll',
                'MaaDerpLearning.dll'
            ],
            linux: [
                'libiomp5.so',
                'libmklml_intel.so',
                'libmkldnn.so'
            ],
            darwin: ['libpaddle_inference.dylib']
        }
        this.libName = {
            win32: 'MaaCore.dll',
            darwin: 'MeoAssistant.dylib',
            linux: 'libMeoAssistant.so'
        }


        function load() {
            try {
                node.connecting = true;
                node.emit("state", "connecting")
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
                const version = GetCoreVersion()
                if (version) {
                    node.error("maaCore connect failed")
                    node.status({fill: "red", shape: "ring", text: RED._("maaCore.status.badping")});
                    node.tick = setTimeout(load, reconnect)
                } else {
                    node.connected = true;
                    node.emit("state", "connected");
                    if (!node.check) {
                        node.check = setInterval(version, 290000);
                    }
                }
            } catch (err) {
                node.error(err)
                node.status({fill: "red", shape: "ring", text: RED._("maaCore.status.badping")});
                // node.dispose()
            }
        }

        node.connect = function () {
            if (!node.connected && !node.connecting) {
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
            if (node.connected) {
                node.connected = false;
                Destroy();
                done();
            } else {
                Destroy();
                done();
            }

        });

        /**
         * 指定资源路径
         * @param path? 未指定就用libPath
         * @returns
         */
        function LoadResource(path?: string): Boolean {
            return node.MeoAsstLib.AsstLoadResource(path ?? node.libPath)
        }

        /**
         * 创建普通实例, 即无回调版
         * @returns 实例指针{ref.Pointer}
         */
        function Create(): boolean {
            node.MeoAsstPtr.placeholder = node.MeoAsstLib.AsstCreate()
            return !!node.MeoAsstPtr.placeholder
        }

        /**
         * @description 创建实例
         * @param uuid 设备唯一标识符
         * @param callback 回调函数
         * @param customArg 自定义参数{???}
         * @returns  是否创建成功
         */
        function CreateEx(
            uuid: string,
            callback: any = callbackHandle,
            customArg: any = createVoidPointer()
        ): boolean {
            if (!node.MeoAsstPtr[uuid]) {
                node.MeoAsstPtr[uuid] = node.MeoAsstLib.AsstCreateEx(callback, customArg)
                return true
            }
            return false // 重复创建
        }

        /**
         * @description 摧毁实例
         * @param uuid 设备唯一标识符
         */
        function Destroy(uuid): void {
            if (node.MeoAsstPtr[uuid]) {
                node.MeoAsstLib.AsstDestroy(node.MeoAsstPtr[uuid])
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete node.MeoAsstPtr[uuid]
            }
        }

        /** @deprecated 已废弃，将在接下来的版本中移除 */
        function Connect(address: string, uuid: string, adbPath: string, config: string): boolean {
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
        function AsyncConnect(address: string, uuid: string, adbPath: string, config: string, block: boolean = false): number {
            return node.MeoAsstLib.AsstAsyncConnect(node.MeoAsstPtr[uuid], adbPath, address, config, block)
        }

        /**
         * 添加任务
         * @param uuid 设备唯一标识符
         * @param type 任务类型, 详见文档
         * @param params 任务json字符串, 详见文档
         * @returns
         */
        function AppendTask(uuid: string, type: string, params: string): number {
            return node.MeoAsstLib.AsstAppendTask(GetCoreInstanceByUUID(uuid), type, params)
        }

        /**
         * 设置任务参数
         * @param uuid 设备唯一标识符
         * @param taskId 任务唯一id
         * @param params 任务参数
         */

        function SetTaskParams(uuid: string, taskId: number, params: string): boolean {
            return node.MeoAsstLib.AsstSetTaskParams(
                GetCoreInstanceByUUID(uuid),
                taskId,
                params
            )
        }

        /**
         * 开始任务
         * @param uuid 设备唯一标识符
         * @returns 是否成功
         */
        function Start(uuid: string): boolean {
            return node.MeoAsstLib.AsstStart(GetCoreInstanceByUUID(uuid))
        }

        /**
         * 停止并清空所有任务
         * @param uuid 设备唯一标识符
         * @returns
         */
        function Stop(uuid: string): boolean {
            return node.MeoAsstLib.AsstStop(GetCoreInstanceByUUID(uuid))
        }

        /**
         * 发送点击
         * @param uuid 设备唯一标识符
         * @param x x坐标
         * @param y y坐标
         * @returns
         */
        function Click(uuid: string, x: number, y: number): boolean {
            return node.MeoAsstLib.AsstClick(GetCoreInstanceByUUID(uuid), x, y)
        }

        /**
         * 异步请求截图, 在回调中取得截图完成事件后再使用GetImage获取截图
         * @param uuid
         * @param block 阻塞
         * @returns
         */
        function AsyncScreenCap(uuid: string, block: boolean = true): number | boolean {
            if (!node.MeoAsstPtr[uuid]) return false
            return node.MeoAsstLib.AsstAsyncScreenCap(GetCoreInstanceByUUID(uuid), block)
        }

        function GetImage(uuid: string): string {
            const buf = Buffer.alloc(5114514)
            // const len = node.MeoAsstLib.AsstGetImage(GetCoreInstanceByUUID(uuid), buf as any, buf.length)
            // const buf2 = buf.slice(0, len as number)
            const len = node.MeoAsstLib.AsstGetImage(GetCoreInstanceByUUID(uuid), buf, buf.length)
            const buf2 = buf.slice(0, Number(len))
            const v2 = buf2.toString('base64')
            return v2
        }

        /**
         * @description core版本
         * @returns 版本
         */
        function GetCoreVersion(): string | null {
            if (!node.connected) return null
            return node.MeoAsstLib.AsstGetVersion()
        }

        function GetCoreInstanceByUUID(uuid: string): AsstInstancePtr {
            return node.MeoAsstPtr[uuid]
        }

        function Log(level: string, message: string): void {
            return node.MeoAsstLib.AsstLog(level, message)
        }

        function SetInstanceOption(uuid: string, key: InstanceOptionKey, value: string): boolean {
            return node.MeoAsstLib.AsstSetInstanceOption(GetCoreInstanceByUUID(uuid), key, value)
        }

        function SetTouchMode(uuid: string, mode: TouchMode): boolean {
            if (!node.MeoAsstPtr[uuid]) {
                return false
            }
            return SetInstanceOption(uuid, InstanceOptionKey.TouchMode, mode)
        }

        /**
         * @description change touch mode for all instances
         * @param mode TouchMode
         * @returns is all changes success
         */
        function ChangeTouchMode(mode: TouchMode): boolean {
            for (const uuid in node.MeoAsstPtr) {
                if (node.MeoAsstPtr[uuid]) {
                    const status = SetTouchMode(uuid, mode)
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
        credentials: {
            user: {type: "text"},
            password: {type: "password"}
        }
    });


}

# 介绍
本程序运行于服务端, 使用katex做核心, 通过Unix域套接字接受信息, 解析tex数学公式成HTML代码后发回给客户端.

# 如何使用
* 首先需要安装 Node.js 和 NPM.
* 克隆后进入打开终端进入目录
依次输入:
```shell
npm install
npm run build
```
然后就编译完成了. 使用如下代码即可运行:
```shell
npm start
```
这时会生成 ```/tmp/php-js.sock```, 如果提示已被占用, 删除已有的套接字文件即可. 虽然名字是```php-js.sock```, 但是实际上可以用于任何支持
Unix域套接字的语言.

另外需要保证客户端有权限读取 ```/tmp/php-js.sock```, 为此通常可以给系统添加服务, 指定运行的用户和组与客户端相同, 或者也可以用
```chmod```命令来赋予读写权限.

客户端发送一个```json```字符串, 格式如下:
```json
{
    "display" : false,
    "tex": "要解析的tex代码"
}
```
这里```display```决定是否启用行间公式模式, 如果为```true```, 则启用行间公式模式.

发送```json```字符串后, 再发送写入结束的信号, PHP中可以用```socket_shutdown```函数来实现, 触发 Node.js的```end```事件, 开始解析.
随后可以用```socket_read```等从套接字中读取生成的html代码.

最后要关闭套接字, PHP中可以使用```socket_close```函数.
fekit-extension-hf
=====================

### 说明 ###

处理header&footer项目编译使用

### 使用方法  ###

在 hf 项目中，调用 

    fekit hf 

即可压缩并混淆

### hf 格式简介 ###

在 html 代码中，可以使用以下几种 hook

{{ver}} - 替换为当前编译时间戳

{{js path}} - 替换为`path`的文件，压缩后的javascript代码

{{css path}} - 替换为`path`的文件，压缩后的css代码

{{html path}} - 替换为`path`的文件，处理后的html代码

以上`path`均使用相对路径
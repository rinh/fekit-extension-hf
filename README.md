fekit-extension-hf
=====================

### 说明 ###

处理header&footer项目编译使用

### 使用方法  ###

在 hf 项目中，调用 

    fekit hf 

即可压缩并混淆

### hf 样式规则 ###
* 1，样式必须 .q_header或 .qhf_开头
* 2，标签样式的定义必须有命名空间，命名空间参考规则1

### hf 格式简介 ###

在 html 代码中，可以使用以下几种 hook


hook  | 功能
-----|----- | ------ | ----
{{ver}} | 替换为当前编译时间戳
{{js path}} | 替换为`path`的文件，压缩后的javascript代码
{{css path}} | 替换为`path`的文件，压缩后的css代码
{{html path}} | 替换为`path`的文件，处理后的html代码

以上`path`均使用相对路径

### hf 参数 ###

参数名  | 简写 | 用途 | 示例
-----|----- | ------ | ----
server | s | 启动服务，用于本地测试| fekit hf -s
port | p | 设置服务端口,默认80 | fekit hf -s -p 8080

### hf server ###

> fekit hf -server用于本地测试hf项目

#####url结构#####
http://127.0.0.1:{port}/{type}

* {port} : 端口
* {type} : 要测试的组类型，如hotel


#####url可带参数如下：#####

参数名  | 功能 |  默认值 | 示例
-----|----- | ------ | ----
item | 启动服务，用于本地测试| 1 | ?item=3
header | 设置服务端口,默认80 | header_main+header_styles | ?header=header_main_mini+header_mini_styles
footer | 同header，用于替换默认footer| footer_public | ?footer=footer_ssl
sidebar | 同header，用于替换sidebar | ucsidebar+ucsidebar_styles | ?header=header_main_mini+header_mini_styles

#####template:#####
开发分支根目录如果有template.html将自动调用template.html作为测试页面，如果没有将调用hf组件提供的默认页面，template.html提供以下hook供编译替换:

hook  | 功能
-----|----- 
{{type}} | 替换业务类型名称
{{header}} | 替换header
{{footer}} | 替换footer
{{sidebar}} | 替换sidebar

也可混用ssi模式，如:

        <div class="q_header q_header_ddr q_header_ddr_home">
            <!--#include virtual="/prd/home/header_main.html" -->
            <!--#include virtual="/prd/home/header_styles.html" -->
        </div>
 
默认template.html:

    <!doctype html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>Quanr HF</title>
        <link rel="stylesheet" href="http://qunarzz.com/home/prd/styles/home@2bf1bf8b37738b3f95d1274a579728d8.css" />
    </head>
    <body>
        <div class="q_header q_header_{{type}} q_header_{{type}}_home">
            {{header}}
        </div>
        <div class="q_pagecontainer">
            <div class="q_pagewrap">
                <div class="q_page">
                    <div class="l_s175m770 clr_after" style="height:650px;">
                        <div class="l_s175">
                            <div class="q_ucsidebar q_ucsidebar_{{type}}_exp q_ucsidebar_{{type}}_item{{item}}">
                                {{sidebar}}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- footer -->
        <div class="qn_footer">
            <div class="inner">
                {{footer}}
            </div>
        </div>  
    </body>
    </html>


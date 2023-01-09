//预览渲染

function renderpreview(content) {
    var rendererMD = new marked.Renderer();
    //重写heading，添加一个toc方法
    rendererMD.heading = function (text, level, raw) {
        var anchor = tocObj.add(text, level);
        return `<a id=${anchor} class="anchor-fix"></a><h${level}>${text}</h${level}>\n`;
    };

    marked.setOptions({
        renderer: rendererMD,
        gfm: true,//它是一个布尔值，默认为true。允许 Git Hub标准的markdown.
        tables: true,//它是一个布尔值，默认为true。允许支持表格语法。该选项要求 gfm 为true。
        breaks: true,//它是一个布尔值，默认为false。允许回车换行。该选项要求 gfm 为true。
        pedantic: false,//它是一个布尔值，默认为false。尽可能地兼容 markdown.pl的晦涩部分。不纠正原始模型任何的不良行为和错误。
        sanitize: false,//它是一个布尔值，默认为false。对输出进行过滤（清理），将忽略任何已经输入的html代码（标签）
        smartLists: true,//它是一个布尔值，默认为false。使用比原生markdown更时髦的列表。 旧的列表将可能被作为pedantic的处理内容过滤掉.
        smartypants: false//它是一个布尔值，默认为false。使用更为时髦的标点，比如在引用语法中加入破折号。
    });
    marked.setOptions({
        highlight: function (code) {
            return hljs.highlightAuto(code).value;
        }
    });

    const tocObj = {
        add: function (text, level) {
            var anchor = `#toc${level}${++this.index}`;
            this.toc.push({anchor: anchor, level: level, text: text});
            return anchor;
        },
        // 使用堆栈的方式处理嵌套的ul,li，level即ul的嵌套层次，1是最外层
        // <ul>
        //   <li></li>
        //   <ul>
        //     <li></li>
        //   </ul>
        //   <li></li>
        // </ul>
        toHTML: function () {
            let levelStack = [];
            let result = '';
            const addStartUL = () => {
                result += '<ul>';
            };
            const addEndUL = () => {
                result += '</ul>\n';
            };
            const addLI = (anchor, text) => {
                result += '<li><a href="#' + anchor + '">' + text + '<a></li>\n';
            };

            this.toc.forEach(function (item) {
                let levelIndex = levelStack.indexOf(item.level);
                // 没有找到相应level的ul标签，则将li放入新增的ul中
                if (levelIndex === -1) {
                    levelStack.unshift(item.level);
                    addStartUL();
                    addLI(item.anchor, item.text);
                } // 找到了相应level的ul标签，并且在栈顶的位置则直接将li放在此ul下
                else if (levelIndex === 0) {
                    addLI(item.anchor, item.text);
                } // 找到了相应level的ul标签，但是不在栈顶位置，需要将之前的所有level出栈并且打上闭合标签，最后新增li
                else {
                    while (levelIndex--) {
                        levelStack.shift();
                        addEndUL();
                    }
                    addLI(item.anchor, item.text);
                }
            });
            // 如果栈中还有level，全部出栈打上闭合标签
            while (levelStack.length) {
                levelStack.shift();
                addEndUL();
            }
            // 清理先前数据供下次使用
            this.toc = [];
            this.index = 0;
            return result;
        },
        toc: [],
        index: 0
    };

    //先解析，才能得到解析后的目录树
    content = marked(content);
    //将目录树转化为html
    tocHtml = "<div class='toc'><h3>文章目录</h3> " + tocObj.toHTML() + "</div>";

    //查找其中的toc字段进行修改替换
    //content = content.replaceAll("<p>[Toc]</p>", tocHtml);
    content = content.replace(/<p>\[Toc]<\/p>/g,tocHtml);

    //显示内容
    //document.getElementById("preview").innerHTML = content;
    $("#preview")[0].innerHTML = content;
}

editor = ace.edit("editor");
$(function () {
    //ace编辑器加载设置
    //ace编辑器初始化
    editor.setTheme("ace/theme/twilight");//设置主题
    editor.session.setMode("ace/mode/markdown");//设置markdown语法
    editor.session.setUseWrapMode(true);//自动换行
    document.getElementById('editor').style.fontSize = '15px';//字体大小
    editor.setHighlightActiveLine(true);//行高亮显示(默认就有的,可以改为false)

    //监听内容改变事件
    editor.getSession().on('change', function (e) {
        content = editor.getValue();
        //渲染
        renderpreview(content);
        //var content2 = marked(content);
        //$("#preview")[0].innerHTML = content2;

        var words_nums = content.length;
        $(".words_nums")[0].innerHTML = content.length;
        var line_nums = editor.session.getLength();
        $(".line_nums")[0].innerHTML = line_nums;
    });

    //监听光标
    editor.session.selection.on('changeCursor', function (e) {
        //计数
        count = editor.selection.getCursor();
        //console.log(a);
        $(".now_row_count")[0].innerHTML = count.row;
        $(".now_column_count")[0].innerHTML = count.column;
        pic_data_fold()
    });
});


function adjust() {
    var w = document.body.clientWidth;
    var h = document.body.clientHeight;
    var centerBar_w = 26; //中间估计栏宽
    var statusBar_h = 20; //底部状态栏高
    var articletitleBar_h = 56;//标题栏高
    var navigationBar_h = 74; //顶部工具栏高
    //var editorPanel = document.getElementsByClassName("layout__panel--editor")[0]
    var editorPanel = $('.layout__panel--editor');
    var previewPabel = $('#preview');
    //var previewPabel = document.getElementById("preview")
    if (w > 636) {
        editorPanel.attr("style", "width:" + ((w - centerBar_w) / 2).toString() + "px;" + "height:" + (h - (articletitleBar_h + navigationBar_h)).toString() + "px");
        previewPabel.attr("style", "width:" + ((w - centerBar_w) / 2).toString() + "px;" + "height:" + (h - (articletitleBar_h + navigationBar_h)).toString() + "px;");
    } else {
        console.log("xiaoshi")
        editorPanel.attr("style", "width:" + (w - centerBar_w).toString() + "px;" + "height:" + (h - (articletitleBar_h + navigationBar_h)).toString() + "px");
        previewPabel.attr("style", "width:0px;" + "height:0px;");
    }
    editor.resize();
}




window.onload = function () {
    //获取 草稿id
    DRAFT_ID = 0;

    //窗口自适应调整
    window.onresize = adjust;
    adjust();
}

editor.on("input", updateToolbar);
$('#button_undo')[0].onclick = function () {
    editor.undo();
}
$('#button_redo')[0].onclick = function () {
    editor.redo();
}

//editor.session.toggleFold(false);
//editor.session.addFold("图片数据", new ace.Range(0,0,1,5));
//图片数据自动折叠
function pic_data_fold() {
    pic_list = editor.findAll_m("![[].*?][(].*?[)]", {regExp: true});
    shuju = editor.findAll_m("[(].*?[)]", {regExp: true});
    for (i in pic_list) {
        pic = pic_list[i];
        if ((pic.end.column - pic.start.column) > 50) {
            var start_row = pic.start.row;
            var start_column = pic.start.column;
            var end_row = pic.start.row;
            var end_column = pic.start.column;
            pic_connect = editor.session.getLines(start_row, end_row)[0]
            pic_connect.indexOf("](");
            pic.start.column = pic.start.column + 30;
            pic.end.column = pic.end.column - 15;
            editor.session.addFold("pic", pic);
        }
    }
}

$('#button_bold')[0].onclick = function () {
    editor.insert("**" + editor.getSelectedText() + "**");
}
$('#button_italic')[0].onclick = function () {
    editor.insert("*" + editor.getSelectedText() + "*");
}
$('#button_title')[0].onclick = function () {
    editor.insert("# " + editor.getSelectedText());
}
$('#button_strikethrough')[0].onclick = function () {
    editor.insert("~~" + editor.getSelectedText() + "~~");
}
$('#button_disorder')[0].onclick = function () {
    var content_list = editor.getSelectedText().split("\n");
    var content = '';
    for (let i in content_list) {
        content = content + "- " + content_list[i] + "\n";
    }
    editor.insert(content);
}
$('#button_order')[0].onclick = function () {
    var content_list = editor.getSelectedText().split("\n");
    var content = '';
    for (let i in content_list) {
        content = content + (i + 1).toString() + ". " + content_list[i] + "\n";
    }
    editor.insert(content);
}
$('#button_todo')[0].onclick = function () {
    var content_list = editor.getSelectedText().split("\n");
    var content = '';
    for (let i in content_list) {
        content = content + "- [ ] " + content_list[i] + "\n";
    }
    editor.insert(content);
}
$('#button_quote')[0].onclick = function () {
    editor.insert("> " + editor.getSelectedText());
}
$('#button_code')[0].onclick = function () {
    editor.insert("```\n" + editor.getSelectedText() + '\n```');
}
$('#button_pic')[0].onclick = function () {
    layer.open({
        type: 1,
        title: "上传图片",
        skin: 'layui-layer-rim', //加上边框
        area: ['412px', '380px'], //宽高
        content: $('.pic_layer')[0].innerHTML
    });
}

function uploadPicture_callback(imagedata) {
    console.log('ss');
    console.log(imagedata);
    editor.insert("\n![](" + imagedata + ")\n");
}

$('#button_video')[0].onclick = function () {
    editor.insert("<iframe height=498 width=510 src='视频链接'>");
}
$('#button_table')[0].onclick = function () {
    var table_text = "|        |        |\n|  ----  |  ----  |\n|        |        |\n|        |        |"
    editor.insert(table_text);
}
$('#button_link')[0].onclick = function () {
    editor.insert("[]()");
}
$('#import-markdown-file-input')[0].onchange = function () {
    var reader = new FileReader();
    reader.readAsText(this.files[0], "UTF-8");//异步读取文件内容，结果用data:url的字符串形式表示
    /*当读取操作成功完成时调用*/

    reader.onload = function (e) {
        const fileString = e.target.result
        // 接下来可对文件内容进行处理
        editor.insert(fileString);
    }
}
$('#button_export')[0].onclick = function () {
    var title = $('.text-input')[0].value;
    var file = new File([editor.getValue()], title + ".md", {type: "text/plain;charset=utf-8"})
    saveAs(file)
}

function updateToolbar() {
    $('#button_save')[0].disabled = editor.session.getUndoManager().isClean();
    $('#save_drafts')[0].disabled = editor.session.getUndoManager().isClean();
    $('#button_undo')[0].disabled = !editor.session.getUndoManager().hasUndo();
    $('#button_redo')[0].disabled = !editor.session.getUndoManager().hasRedo();
    if (editor.session.getUndoManager().isClean()) {
        $('#button_save')[0].classList.remove('hasChg');
    } else {
        $('#button_save')[0].classList.add('hasChg');
    }
}

function save() {
    var title = $('.text-input')[0].value;
    var content = editor.getValue();
    $.post(rootPath + "admin/editor/save_draft", {"title": title, "content": content, "id": DRAFT_ID}, function (data) {
        if (data.result === "success") {
            DRAFT_ID = data.id
            lightyear.notify('保存成功，文章ID:' + DRAFT_ID.toString(), 'success', 5000);
            editor.session.getUndoManager().markClean(); // 清理记录证明最近保存过
            updateToolbar();
        } else {
            lightyear.notify('操作失败!', 'danger', 5000);
        }
    });
}

$('#button_save')[0].onclick = save;
$('#save_drafts')[0].onclick = save;

$('#publish')[0].onclick = function () {
    $.post(rootPath + "admin/editor/publish", {}, function (data) {
        layer.open({
            type: 1,
            title: false,
            content: data //这里content是一个DOM，注意：最好该元素要存放在body最外层，否则可能被其它的相对元素所影响
        });
    });
}
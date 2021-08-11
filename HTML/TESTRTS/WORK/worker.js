var obj_units={};//用id索引所有单位
var arr_part=[];//多重数组，地图分块，优化单位查找速度，最下层是包含数组的对象
var partSize=20;
var minx=-50,maxx=50,minz=-50,maxz=50,partSizeX=partSize,partSizeZ=partSize;
//var flag_autorun=false;
var flag_thinking=false;
//加载其他js文件
var newland={}
if(!newland.importScripts){ newland.importScripts=(function(globalEval){ var xhr=new XMLHttpRequest; return function importScripts(){ var args=Array.prototype.slice.call(arguments) ,len=args.length ,i=0 ,meta ,data ,content ; for(;i<len;i++){ if(args[i].substr(0,5).toLowerCase()==="data:"){ data=args[i]; content=data.indexOf(","); meta=data.substr(5,content).toLowerCase(); data=decodeURIComponent(data.substr(content+1)); if(/;\s*base64\s*[;,]/.test(meta)){ data=atob(data); } if(/;\s*charset=[uU][tT][fF]-?8\s*[;,]/.test(meta)){ data=decodeURIComponent(escape(data)); } }else{ xhr.open("GET",args[i],false); xhr.send(null); data=xhr.responseText; } globalEval(data); } }; }(eval)); }
newland.importScripts("OneThink.js");
newland.importScripts("../VTools.js");

self.postMessage(JSON.stringify({type:"consoleLog",text:"work线程加载其他js文件完成"}));

self.onmessage=function(e)
{
    var obj_data=JSON.parse(e.data)
    if(obj_data.type=="initWork")
    {
        self.postMessage(JSON.stringify({type:"consoleLog",text:"开始初始化work线程"}));
        var mapWidth=maxx-minx;
        var mapHeight=maxz-minz
        var partCountX=Math.ceil(mapWidth/partSizeX);
        var partCountZ=Math.ceil(mapHeight/partSizeZ);
        for(var i=0;i<partCountX;i++)//为地图上的每个区域分配一个数组元素
        {//俯视来看左下角是第一个区域，之后沿着z轴划分一系列区域，这一条z轴划分完毕后，沿x轴移动到下一根z轴
            var arr=[];
            for(var j=0;j<partCountZ;j++)
            {
                var obj_part={arr_unit:[],partx:i,partz:j,posx:i*partSizeX,posz:i*partSizeZ}//每个区域是一个对象，其中包括区域内的单位数组
                arr.push(obj_part);
            }
            arr_part.push(arr);
        }
        //为每个区域标明东南西北区域？能够少量节约计算力
        arr_part.forEach((arr,i)=>{
            arr.forEach((obj_part,j)=>{
                if(arr_part[i-1]&&arr_part[i-1][j])
                {
                    obj_part[3]=arr_part[i-1][j];//west
                }
                else
                {
                    obj_part[3]=null;
                }
                if(arr_part[i+1]&&arr_part[i+1][j])//east
                {
                    obj_part[0]=arr_part[i+1][j]
                }
                else
                {
                    obj_part[0]=null;
                }
                if(arr_part[i][j-1])
                {
                    obj_part[2]=arr_part[i][j-1];//north
                }
                else
                {
                    obj_part[2]=null;
                }
                if(arr_part[i][j+1])
                {
                    obj_part[1]=arr_part[i][j+1];//south
                }
                else
                {
                    obj_part[1]=null;
                }
            })
        })

        var obj_units0=obj_data.obj_units0;
        for(var key in obj_units0)//在work线程中为每个单位建立思考对象
        {
            var oneThink=new OneThink(obj_units0[key])
            obj_units[key]=oneThink;
        }        

        self.postMessage(JSON.stringify({type:"consoleLog",text:"work线程单位思考对象初始化完成"}));

        //建立单位区域索引和每个单位的初始影响范围
        for(var key in obj_units)
        {
            var one=obj_units[key];           
            one.partx=Math.floor((one.pos.x-minx)/partSizeX);
            one.partz=Math.floor((one.pos.z-minz)/partSizeZ);
            arr_part[one.partx][one.partz].arr_unit.push(one);

        }
        self.postMessage(JSON.stringify({type:"consoleLog",text:"work线程单位区域索引初始化完毕"}));
    

        //self.postMessage(JSON.stringify({type:"updateUnits",obj_units0:obj_units0}));
        self.postMessage(JSON.stringify({type:"workInited"}));
        Loop();

    }
    else if(obj_data.type=="command")
    {
        var func=eval(obj_data.func);//对于方法对象
        var obj_p=obj_data.obj_p;
        //eval(func+"("+obj_p+")");//直接这样执行obj_p会被强制转换为字符串类型！！！！
        func(obj_p) 
    }
    else if(obj_data.type=="setValue")
    {
        //var key=eval(obj_data.key);//对于直接量则会变成值而非指针！！！！
        var key=obj_data.key
        var value=obj_data.value;
        eval(key+"="+value);
        //key=value;
    }
    else if(obj_data.type=="updateUnits")
    {
        var obj_units0=obj_data.obj_units0;
        for(var key in obj_units0)
        {
            var obj0=obj_units0[key];//从渲染线程传递过来的新状态
            var obj=obj_units[key];
            obj.doing=obj0.doing;//正在做的事
            //obj.wanting=obj0.wanting;//想要做的事
            //this.being={};//正在遭受
            //obj.feeling=obj0.feeling;//命令通过unitCommand传递！
            obj.hp=obj0.hp;
            obj.pos=obj0.pos;//位置变化由渲染线程计算
            var partx=Math.floor((obj.pos.x-minx)/partSizeX);
            var partz=Math.floor((obj.pos.z-minz)/partSizeZ);
            if(partx!=obj.partx||partz!=obj.partz)//如果位置索引发生变化
            {
                var arr_unit=arr_part[obj.partx][obj.partz];
                var len=arr_unit.length;
                for(var i=0;i<len;i++)
                {
                    if(arr_unit[i].id==obj.id)
                    {
                        arr_unit.splice(i,1);
                        break;
                    }
                }
                obj.partx=partx;
                obj.partz=partz;
                arr_part[partx][partz].arr_unit.push(obj);
            }

        }
    }
    else if(obj_data.type=="unitCommand")
    {
        var obj_units0=obj_data.obj_units0;
        for(var key in obj_units0)
        {
            var obj0 = obj_units0[key];//从渲染线程传递过来的新状态
            var obj = obj_units[key];
            obj.target=obj0.target;//目标地点
            obj.doing=obj0.doing;//正在做的事
            obj.wanting=obj0.wanting;//想要做的事
            //this.being={};//正在遭受
            obj.feeling=obj0.feeling;
        }
    }
}
var count_a=0;
function runOneStep(){
    count_a=0;
    if(flag_thinking)//正在进行上一次思考
    {
        self.postMessage(JSON.stringify({type:"consoleError",text:"正在进行上一次思考"}));
        return;
    }
    flag_thinking=true;
    var startTime=new Date().getTime();
    //self.postMessage(JSON.stringify({type:"consoleLog",text:"开始计算影响力："+startTime}));
    OneThink.clearAllInfluence(arr_part);
    for(var key in obj_units)//影响
    {
        var unit=obj_units[key];
        if(unit.doing!="dead"&&unit.doing!="unconscious") {
            OneThink.oneMakeInfluence(unit, arr_part, partSize);//这件事每一周期都要做
        }
    }
    //self.postMessage(JSON.stringify({type:"consoleLog",text:"开始思考："+(new Date().getTime())}));
    var obj_units0={};
        for(var key in obj_units)//思考
        {
            var unit=obj_units[key];
            if(unit.hp<=0)
            {
                unit.doing="dead";
            }
            if(unit.doing!="dead"&&unit.doing!="unconscious"&&unit.doing!="attacking")
            {
                var arr_command=OneThink.think(unit,obj_units,arr_part,partSize);
                if(arr_command.length>0)
                {
                    obj_units0[unit.id]={arr_command:arr_command};//.arr_command=arr_command;
                }

            }
        }
    self.postMessage(JSON.stringify({type:"unitCommand",obj_units0:obj_units0,count_a:count_a}));

    var endTime=new Date().getTime();
    //self.postMessage(JSON.stringify({type:"consoleLog",text:"完成思考："+(endTime-startTime)}));
    flag_thinking=false;
}
//Loop指令由前端发来
var flag_autorun=true;
var lastframe=new Date().getTime();
    function Loop()
    {
        if(flag_autorun)
        {
            runOneStep();
            var thisframe=new Date().getTime();
            //self.postMessage(JSON.stringify({type:"consoleLog",text:thisframe-lastframe}));//把历史演变保存在哪里？
            //console.log(thisframe-lastframe,"red:"+obj_owners.red.countAlive,"blue:"+obj_owners.blue.countAlive);
            lastframe=thisframe;
        }
        //self.requestAnimationFrame(function(){Loop()});
        self.setTimeout(function(){Loop()},500)
    }
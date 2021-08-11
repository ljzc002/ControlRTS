//用于RTS控制的相机-》用大遮罩多层pick代替计算框选位置
var node_temp;
function InitMouse()
{
    canvas.addEventListener("blur",function(evt){//监听失去焦点
        releaseKeyStateOut();
    })
    canvas.addEventListener("focus",function(evt){//改为监听获得焦点，因为调试失去焦点时事件的先后顺序不好说
        releaseKeyStateIn();
    })

    //scene.onPointerPick=onMouseClick;//如果不attachControl onPointerPick不会被触发，并且onPointerPick必须pick到mesh上才会被触发
    canvas.addEventListener("click", function(evt) {//这个监听也会在点击GUI按钮时触发！！
        onMouseClick(evt);//
    }, false);
    canvas.addEventListener("dblclick", function(evt) {//是否要用到鼠标双击？？
        onMouseDblClick(evt);//
    }, false);
    scene.onPointerMove=onMouseMove;
    scene.onPointerDown=onMouseDown;
    scene.onPointerUp=onMouseUp;
    //scene.onKeyDown=onKeyDown;
    //scene.onKeyUp=onKeyUp;
    window.addEventListener("keydown", onKeyDown, false);//按键按下
    window.addEventListener("keyup", onKeyUp, false);//按键抬起
    window.onmousewheel=onMouseWheel;
    window.addEventListener("resize", function () {
        if (engine) {
            engine.resize();
            var width=canvas.width;
            var height=canvas.height;
            var fov=camera0.fov;//以弧度表示的相机视野角《-这个计算并不准确！！-》尝试改用巨型蒙版方法
            camera0.pos_kuangbase=new BABYLON.Vector3(-camera0.dis*Math.tan(fov)
                , camera0.dis*Math.tan(fov)*height/width, camera0.dis);
        }
    },false);
    document.oncontextmenu = function(evt){
        //点击右键后要执行的代码
        onContextMenu(evt);
        return false;//阻止浏览器的默认弹窗行为
    }


    node_temp=new BABYLON.TransformNode("node_temp",scene);//用来提取相机的姿态矩阵
    node_temp.rotation=camera0.rotation;

    pso_stack=camera0.position.clone();
}
function onMouseDblClick(evt)
{
    var pickInfo = scene.pick(scene.pointerX, scene.pointerY, null, false, camera0);
    if(pickInfo.hit)
    {
        var mesh = pickInfo.pickedMesh;
        if(mesh.name.split("_")[0]=="mp4")//重放视频
        {
            if(obj_videos[mesh.name])
            {
                var videoTexture=obj_videos[mesh.name];

                    videoTexture.video.currentTime =0;

            }
        }
    }
}
function onMouseClick(evt)
{
    if(flag_view=="rts"&&evt.button!=2&&!flag_moved) {//选择了单个单位,看来精灵不能被点击！
        evt.preventDefault();
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, (mesh)=>(mesh.name.substr(0,3)=="k1_")//mesh.name.substr(0,5)=="bing_"
            , false, camera0);
        if(pickInfo.hit)
        {
            var kuang = pickInfo.pickedMesh;
            console.log(kuang);
            resetSelected();
            var unit=kuang.unit;
            if(unit)
            {
                kuang.isVisible=true;
                //mesh.material=MyGame.materials.mat_frame;
                arr_selected.push(unit);
            }

        }else
        {
            resetSelected();
        }

        //但是这种方法并不精确，经常点到多个单位！！！！
        // var m_cam=camera0.getWorldMatrix();//精灵不能点击，所以改为使用较小的拖拽方块
        // var pickInfo0 = scene.pick(downPointerX, downPointerY, (mesh)=>(mesh.id=="mesh_kuang0")
        //     , false, camera0);
        // if(pickInfo0.hit)
        // {
        //     var point2 = pickInfo0.pickedPoint;
        //     point2=BABYLON.Vector3.TransformCoordinates(point2,m_cam.clone().invert());//转为相机的局部坐标系中的坐标
        //     var width2 = 0.1;
        //     var height2 = 0.1;
        //     if (camera0.mesh_kuang) {
        //         camera0.mesh_kuang.dispose();
        //     }
        //     camera0.mesh_kuang = new BABYLON.MeshBuilder.CreatePlane("mesh_kuang"
        //         , {width: width2, height: height2, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
        //     camera0.mesh_kuang.parent = camera0;
        //     camera0.mesh_kuang.renderingGroupId = 0;//测试时可见，实际使用时不可见
        //     camera0.mesh_kuang.position = point2;
        //     camera0.mesh_kuang.rotation.x = Math.PI;
        //
        //     //发射射线
        //     resetSelected();
        //     requestAnimFrame(function(){
        //         arr_unit.forEach((obj, i) => {
        //             if(obj.hp>0)
        //             {
        //                 var ray = BABYLON.Ray.CreateNewFromTo(camera0.position, obj.mesh.position);
        //                 var pickInfo = ray.intersectsMesh(camera0.mesh_kuang);//难道是因为网格尚未渲染，所以找不到？
        //                 if (pickInfo.hit)//相机与物体的连线穿过了框网格
        //                 {
        //                     obj.kuang.isVisible=true;
        //                     arr_selected.push(obj);
        //                 }
        //             }
        //
        //         })
        //         camera0.mesh_kuang.dispose();
        //         camera0.mesh_kuang = null;
        //     })
        // }
    }
}
var lastPointerX,lastPointerY;
var flag_view="free"
var obj_keystate=[];
var pso_stack;
var flag_moved=false;//在拖拽模式下有没有移动，如果没移动则等同于click
var point0,point;//拖拽时点下的第一个点
function onMouseMove(evt)
{

    if(flag_view=="rts")
    {
        evt.preventDefault();
        if(camera0.line_kuang.isVisible)
        {
            if(drawKuang()){
                flag_moved=true;
            }
        }
    }
    lastPointerX=scene.pointerX;
    lastPointerY=scene.pointerY;
}
function drawKuang(){
    var m_cam=camera0.getWorldMatrix();
    if(!point0)
    {
        var pickInfo0 = scene.pick(downPointerX, downPointerY, (mesh)=>(mesh.id=="mesh_kuang0")
            , false, camera0);
        if(pickInfo0.hit)
        {
            point0 = pickInfo0.pickedPoint;
            point0=BABYLON.Vector3.TransformCoordinates(point0,m_cam.clone().invert());//转为相机的局部坐标系中的坐标
        }
    }
    if(point0)
    {
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, (mesh)=>(mesh.id=="mesh_kuang0")
            , false, camera0);
        if(pickInfo.hit)
        {
            point = pickInfo.pickedPoint ;
            point=BABYLON.Vector3.TransformCoordinates(point,m_cam.clone().invert());
            camera0.path_line_kuang=[point0,new BABYLON.Vector3(point.x, point0.y, 3)
                ,point,new BABYLON.Vector3(point0.x, point.y, 3),point0];//封口
            camera0.line_kuang= BABYLON.MeshBuilder.CreateDashedLines("line_kuang"
                , {points: camera0.path_line_kuang, updatable: true, instance: camera0.line_kuang}, scene);
        }
    }
    if(Math.abs(scene.pointerX-downPointerX)>1||Math.abs(scene.pointerY-downPointerY)>1)
    {
        return true;
    }
    else
    {
        return false;
    }
}
var downPointerX,downPointerY;
function onMouseDown(evt)
{
    if(flag_view=="rts"&&evt.button!=2) {
        evt.preventDefault();
        //单选单位的情况放在click中
        //显示框选框（四条线段围成的矩形）
        downPointerX=scene.pointerX;
        downPointerY=scene.pointerY;
        camera0.line_kuang.isVisible=true;
        drawKuang();
    }
}
function onMouseUp(evt)
{
    if(flag_view=="rts"&&evt.button!=2) {
        evt.preventDefault();
        if(camera0.line_kuang.isVisible)
        {
            camera0.line_kuang.isVisible=false;
            if(flag_moved)
            {
                requestAnimFrame(function(){
                    flag_moved = false;//但是click事件紧跟在mouseup事件之后，同步设置则起不到区分拖拽和单击的作用！！！！
                })


                var pos = new BABYLON.Vector3((point0.x + point.x) / 2, (point0.y + point.y) / 2, 3);
                var width2 = Math.abs(point0.x - point.x);
                var height2 = Math.abs(point0.y - point.y);
                if (camera0.mesh_kuang) {
                    camera0.mesh_kuang.dispose();
                }
                camera0.mesh_kuang = new BABYLON.MeshBuilder.CreatePlane("mesh_kuang"
                    , {width: width2, height: height2, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
                camera0.mesh_kuang.parent = camera0;
                camera0.mesh_kuang.renderingGroupId = 0;//测试时可见，实际使用时不可见
                camera0.mesh_kuang.position = pos;
                camera0.mesh_kuang.rotation.x = Math.PI;
                //camera0.mesh_kuang.material=MyGame.materials.mat_sand;

                //发射射线
                resetSelected();
                requestAnimFrame(function(){
                    arr_unit.forEach((obj, i) => {
                        if(obj.hp>0)
                        {
                            var ray = BABYLON.Ray.CreateNewFromTo(camera0.position, obj.mesh.position);
                            //console.log(i);
                            //var pickInfo = scene.pickWithRay(ray, (mesh)=>(mesh.id=="mesh_kuang0"));
                            var pickInfo = ray.intersectsMesh(camera0.mesh_kuang);//难道是因为网格尚未渲染，所以找不到？
                            if (pickInfo.hit)//相机与物体的连线穿过了框网格
                            {
                                //obj.mesh.material = MyGame.materials.mat_frame;
                                obj.kuang.isVisible=true;
                                arr_selected.push(obj);
                            }
                            //ray.dispose();//射线没有这个方法？
                        }

                    })
                    camera0.mesh_kuang.dispose();
                    camera0.mesh_kuang = null;
                })

            }
        }
        point0=null;
        point=null;

    }
}
function onKeyDown(event)
{
    if(flag_view=="rts") {
        event.preventDefault();
        var key = event.key;
        obj_keystate[key] = 1;
        if(obj_keystate["Shift"]==1)
        {
            obj_keystate[key.toLowerCase()] = 1;
        }
    }
    else {
        var key = event.key;
        if(key=='f')
        {
            if(DoAni)
            {
                DoAni();
            }
        }
    }
}
function onKeyUp(event)
{
    var key = event.key;
    if(key=="v"||key=="Escape")
    {
        event.preventDefault();
        if(flag_view=="rts")
        {
            flag_view="free";
            camera0.attachControl(canvas, true);
            pso_stack=camera0.positions;

        }
        else if(flag_view=="free")
        {
            flag_view="rts";
            camera0.position= pso_stack;
            resetCameraRotation(camera0);
            camera0.detachControl()
        }
    }
    if(flag_view=="rts") {
        event.preventDefault();

        obj_keystate[key] = 0;
        //因为shift+w=W，所以为了避免结束高速运动后，物体仍普速运动
        obj_keystate[key.toLowerCase()] = 0;
    }
}
function onMouseWheel(event){
    var delta =event.wheelDelta/120;
    if(flag_view=="rts")
    {
        camera0.move+=delta;
        if(camera0.move>16.8)//防止相机过于向下
        {
            delta=delta-(camera0.move-16.8);
            camera0.move=16.8;
        }
        //camera0.movePOV(0,0,delta);//轴向移动相机？<-mesh有这一方法，但camera没有！！
        movePOV(node_temp,camera0,new BABYLON.Vector3(0,0,delta));//camera0只能取姿态，不能取位置！！！！
    }
}
function onContextMenu(evt)
{
    var pickInfo = scene.pick(scene.pointerX, scene.pointerY,  (mesh)=>(mesh.id!="mesh_kuang0"), false, MyGame.camera0);
    if(pickInfo.hit)
    {
        var mesh = pickInfo.pickedMesh;
        //if(mesh.myname=="navmeshdebug")//这是限制只能点击导航网格
        var startingPoint=pickInfo.pickedPoint;
        //var agents = MyGame.crowd.getAgents();
        var len=arr_selected.length;
        var i;
        var obj_selected={};
        for (i=0;i<len;i++) {//分别指挥被框选中的每个单位
            var unit=arr_selected[i];
            //var agent=agents[unit.idx];
            //移动可以分为攻击移动和强制移动两种，默认是攻击移动？
            unit.data.state.doing="waiting";//正在移动《-确保开始移动后才能改为walking，也就是说只能由move方法设置！
            unit.data.state.wanting="Attackto";//想要攻击移动
            unit.data.state.feeling="commanded";//收到命令
            unit.target={x:startingPoint.x,y:startingPoint.y,z:startingPoint.z}
            //命令发出后，交给逻辑线程，逻辑线程进行判断后做出行动
            //crowd.agentGoto(agent, navigationPlugin.getClosestPoint(startingPoint));
            obj_selected[unit.id]=unit;
        }
        var obj_units0=One.obj2data(obj_selected);
        worker.postMessage(JSON.stringify({type:"unitCommand",obj_units0:obj_units0}));
    }

}

function movePOV(node,node2,vector3)
{
    var m_view=node.getWorldMatrix();
    v_delta=BABYLON.Vector3.TransformCoordinates(vector3,m_view);
    var pos_temp=node2.position.add(v_delta);
    node2.position=pos_temp;
}
function resetSelected(){
    arr_selected.forEach((obj,i)=>{
        //如果单位选中前后有外观变化，则在这里切换
        obj.kuang.isVisible=false;
        //obj.mesh.material=MyGame.materials.mat_sand;
    });
    arr_selected=[];
}
function resetCameraRotation(camera)
{
    //camera.movePOV(0,0,-camera0.move||0);//轴向移动相机？<-不需要，把转为自由相机前的位置入栈即可
    //camera.move=0;
    camera.rotation.x=Math.PI/4;
    camera.rotation.y=0;
    camera.rotation.z=0;
}
function releaseKeyStateIn(evt)
{
    for(var key in obj_keystate)
    {
        obj_keystate[key]=0;
    }
    lastPointerX=scene.pointerX;
    lastPointerY=scene.pointerY;

}
function releaseKeyStateOut(evt)
{
    for(var key in obj_keystate)
    {
        obj_keystate[key]=0;
    }
    // scene.onPointerMove=null;
    // scene.onPointerDown=null;
    // scene.onPointerUp=null;
    // scene.onKeyDown=null;
    // scene.onKeyUp=null;
}

var pos_last;
var delta;
var v_delta;
function MyBeforeRender()
{
    pos_last=camera0.position.clone();
    scene.registerBeforeRender(
        function(){
            //Think();
            var obj_count={a:0,b:0};
            if(flag_runningstate=="初始化完成")
            {
                var jiao_camera0=camera0.rotation.y%(Math.PI*2);
                if(jiao_camera0<0)
                {
                    jiao_camera0+=Math.PI*2;
                }
                var len = arr_unit.length;
                //var flag_rest=false;//每个运动群组都要有专属的运动结束标志！！！！
                var obj_send={};
                for(let i = 0;i<len;i++)
                {
                    var unit = arr_unit[i];
                    unit.trf.position = MyGame.crowd.getAgentPosition(unit.idx);
                    if(unit.data.state.doing!="attacking")
                    {
                        unit.face=unit.trf.position.subtract(unit.mesh.position);
                    }
                    var jiao_face=Math.atan2(unit.face.x,unit.face.z);
                    if(jiao_face<0)
                    {
                        jiao_face+=Math.PI*2;
                    }

                    // if(jiao_camera0<0)
                    // {
                    //     jiao_camera0+=Math.PI*2;
                    // }
                    // var cface=unit.trf.position.subtract(camera0.position);
                    // var num=vxz.isSameSide(cface,unit.face);
                    // if(num>0)
                    // {
                    //
                    // }
                    if(jiao_camera0-jiao_face>0&&jiao_camera0-jiao_face<Math.PI)
                    {
                        unit.mesh.invertU=true;
                    }
                    else
                    {
                        unit.mesh.invertU=false;
                    }

                    unit.mesh.position=unit.trf.position;
                   // unit.kuang.position=unit.trf.position;
                    //unit.kuang.position.y=unit.kuang.position.y+0.8;
                    unit.pos={x:unit.trf.position.x,y:unit.trf.position.y,z:unit.trf.position.z}
                    if(true)//死亡的单位也要同步给逻辑线程，否则会不断移动？！如果这个单位在运动，则要把单位的信息同步给逻辑线程
                    {
                        obj_send[unit.id]=unit

                    }
                    if(unit.hp>0)
                    {
                        obj_count[unit.owner]+=1;
                    }

                }
                var obj_units0=One.obj2data(obj_send);
                worker.postMessage(JSON.stringify({type:"updateUnits",obj_units0:obj_units0}));
                div_middle.innerHTML="红："+obj_count.a+"，蓝："+obj_count.b;
                // if(bing0)
                // {
                //     bing0.position.x+=0.01;
                //     bing0.invertU=!bing0.invertU
                // }

            }

        }
    )
    scene.registerAfterRender(
        function() {
            if(flag_view=="rts")
            {
                var flag_speed=2;
                //var m_view=camera0.getViewMatrix();
                //var m_view=camera0.getProjectionMatrix();
                //var m_view=node_temp.getWorldMatrix();
                //只检测其运行方向？-》相对论问题！《-先假设直接外围环境不移动
                if(obj_keystate["Shift"]==1)//Shift+w的event.key不是Shift和w，而是W！！！！
                {
                    flag_speed=10;
                }
                delta=engine.getDeltaTime();
                //console.log(delta);
                flag_speed=flag_speed*engine.getDeltaTime()/10;
                var r_cameramove=(camera0.length0-camera0.move)/camera0.length0//相机移动造成的速度变化
                if(r_cameramove<0.1)
                {
                    r_cameramove=0.1;
                }
                if(r_cameramove>5)
                {
                    r_cameramove=5;
                }
                flag_speed=flag_speed*r_cameramove;
                var v_temp=new BABYLON.Vector3(0,0,0);
                if(obj_keystate["w"]==1)
                {
                    v_temp.z+=0.1*flag_speed;

                }
                if(obj_keystate["s"]==1)
                {
                    v_temp.z-=0.1*flag_speed;
                }
                if(obj_keystate["d"]==1)
                {
                    v_temp.x+=0.1*flag_speed;
                }
                if(obj_keystate["a"]==1)
                {
                    v_temp.x-=0.1*flag_speed;
                }
                // if(obj_keystate[" "]==1)
                // {
                //     v_temp.y+=0.05*flag_speed;
                // }
                // if(obj_keystate["c"]==1)
                // {
                //     v_temp.y-=0.05*flag_speed;
                // }

                //camera0.position=camera0.position.add(BABYLON.Vector3.TransformCoordinates(v_temp,camera0.getWorldMatrix()).subtract(camera0.position));
                //engine.getDeltaTime()
                //v_delta=BABYLON.Vector3.TransformCoordinates(v_temp,m_view);
                var pos_temp=camera0.position.add(v_temp);
                camera0.position=pos_temp;
                // if(camera0.line_kuang.isVisible)
                // {
                //     camera0.line_kuang= BABYLON.MeshBuilder.CreateDashedLines("line_kuang"
                //         , {points: camera0.path_line_kuang, updatable: true, instance: camera0.line_kuang}, scene);
                // }
            }
            pos_last=camera0.position.clone();
        }
    )
    engine.runRenderLoop(function () {
        engine.hideLoadingUI();
        if (divFps) {
            divFps.innerHTML = engine.getFps().toFixed() + " fps";
        }
        scene.render();
    });
}
function sort_compare(a,b)
{
    return a.distance-b.distance;
}
var requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
            window.setTimeout(callback, 1000/60);
        };
})();
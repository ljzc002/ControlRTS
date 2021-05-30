//用于RTS控制的相机
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
    if(flag_view=="locked") {
        ThrowSomeBall();
    }
    // var pickInfo = scene.pick(scene.pointerX, scene.pointerY, null, false, camera0);
    // if(pickInfo.hit)
    // {
    //     var mesh = pickInfo.pickedMesh;
    //     if(mesh.name.split("_")[0]=="mp4")//启停视频
    //     {
    //         if(obj_videos[mesh.name])
    //         {
    //             var videoTexture=obj_videos[mesh.name];
    //             if(videoTexture.video.paused)
    //             {
    //                 videoTexture.video.play();
    //             }
    //             else
    //             {
    //                 videoTexture.video.pause();
    //             }
    //         }
    //     }
    // }

}
var lastPointerX,lastPointerY;
var flag_view="free"
var flag_locked;
var obj_keystate=[];
var pso_stack;
function onMouseMove(evt)
{

    if(flag_view=="rts")
    {
        evt.preventDefault();
        if(camera0.line_kuang.isVisible)
        {
            drawKuang();
        }
    }
    lastPointerX=scene.pointerX;
    lastPointerY=scene.pointerY;
}
function drawKuang(){
    //var fov=camera0.fov;//以弧度表示的相机视野角
    var width=canvas.width;
    var height=canvas.height;
    var pos_kuangbase=camera0.pos_kuangbase;
    var x0=pos_kuangbase.x+(downPointerX/width)*(-pos_kuangbase.x*2);
    var y0=pos_kuangbase.y-(downPointerY/height)*(pos_kuangbase.y*2);
    var x1=pos_kuangbase.x+(scene.pointerX/width)*(-pos_kuangbase.x*2);
    var y1=pos_kuangbase.y-(scene.pointerY/height)*(pos_kuangbase.y*2);
    //var m_view=node_temp.getWorldMatrix();
    //BABYLON.Vector3.TransformCoordinates(v_temp,m_view);
    camera0.path_line_kuang=[new BABYLON.Vector3(x0, y0, 3),new BABYLON.Vector3(x1, y0, 3)
        ,new BABYLON.Vector3(x1, y1, 3),new BABYLON.Vector3(x0, y1, 3),new BABYLON.Vector3(x0, y0, 3)];//封口
    camera0.line_kuang= BABYLON.MeshBuilder.CreateDashedLines("line_kuang"
        , {points: camera0.path_line_kuang, updatable: true, instance: camera0.line_kuang}, scene);
    //instance方法必须要求instance可见，并且至少有一段可见长度！！！！

    // camera0.line_kuang2=BABYLON.MeshBuilder.CreateDashedLines("line_kuang2"
    //     , {points: camera0.path_line_kuang, updatable: true, instance: camera0.line_kuang2}, scene);//必须要求instance可见？
    //camera0.line_kuang.renderingGroupId=3;
    //camera0.line_kuang.parent=camera0;
    //camera0.line_kuang.isVisible=true;
    //console.log(camera0.line_kuang.renderingGroupId);
    //console.log(camera0.path_line_kuang[0],camera0.path_line_kuang[1]);
}
var downPointerX,downPointerY;
function onMouseDown(evt)
{
    if(flag_view=="rts") {
        evt.preventDefault();
        //显示框选框（四条线段围成的矩形）
        downPointerX=scene.pointerX;
        downPointerY=scene.pointerY;
        camera0.line_kuang.isVisible=true;
        drawKuang();

    }

}
function onMouseUp(evt)
{
    if(flag_view=="rts") {
        evt.preventDefault();
        if(camera0.line_kuang.isVisible)
        {
            camera0.line_kuang.isVisible=false;
            var width=canvas.width;
            var height=canvas.height;
            var pos_kuangbase=camera0.pos_kuangbase;
            //抬起时进行射线计算（生成一个临时平面？）
            var x0=pos_kuangbase.x+(downPointerX/width)*(-pos_kuangbase.x*2);
            var y0=pos_kuangbase.y-(downPointerY/height)*(pos_kuangbase.y*2);
            var x1=pos_kuangbase.x+(scene.pointerX/width)*(-pos_kuangbase.x*2);
            var y1=pos_kuangbase.y-(scene.pointerY/height)*(pos_kuangbase.y*2);

            var pos=new BABYLON.Vector3((x0+x1)/2, (y0+y1)/2, 3);
            var width2=Math.abs(x1-x0);
            var height2=Math.abs(y1-y0);
            if(camera0.mesh_kuang)
            {
                camera0.mesh_kuang.dispose();
            }
            camera0.mesh_kuang=new BABYLON.MeshBuilder.CreatePlane("mesh_kuang"
                ,{width:width2,height:height2,sideOrientation:BABYLON.Mesh.DOUBLESIDE},scene);
            camera0.mesh_kuang.parent=camera0;
            camera0.mesh_kuang.renderingGroupId=3;//测试时可见，实际使用时不可见
            camera0.mesh_kuang.position=pos;
            camera0.mesh_kuang.rotation.x=Math.PI;
            //camera0.mesh_kuang.material=MyGame.materials.mat_sand;

            //发射射线
            var len=arr_unit.length;
            arr_selected.forEach((obj,i)=>{
                //如果单位选中前后有外观变化，则在这里切换
                obj.mesh.material=MyGame.materials.mat_sand;
            });
            arr_selected=[];
            arr_unit.forEach((obj,i)=>{
                var ray =BABYLON.Ray.CreateNewFromTo(camera0.position,obj.mesh.position);
                console.log(i);
                var pickInfo=scene.pickWithRay(ray
                    ,function(mesh)//不加predicate参数的测试将尝试匹配场景中的所有网格！！
                    {
                        console.log(mesh.id);
                        if(mesh.id=="mesh_kuang")
                        {
                            return true;
                        }
                        else {
                            return false;
                        }
                    });
                if(pickInfo&&pickInfo.hit)//相机与物体的连线穿过了框网格
                {
                    obj.mesh.material=MyGame.materials.mat_frame;
                    arr_selected.push(obj);
                }
                //ray.dispose();//射线没有这个方法？
            })
            camera0.mesh_kuang.dispose();
            camera0.mesh_kuang=null;
        }


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
function movePOV(node,node2,vector3)
{
    var m_view=node.getWorldMatrix();
    v_delta=BABYLON.Vector3.TransformCoordinates(vector3,m_view);
    var pos_temp=node2.position.add(v_delta);
    node2.position=pos_temp;
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
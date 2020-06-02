var single={vision:'1.0.0'};

single.test=function(name){

    this.name=name;
    //自身不会执行 外部可以调用
    this.foo=function(){
        console.log(this.name)
    }
    
   //this.foo();    //xiaoming
   //this.judgeNum(12)
   console.log('test1的打印信息:'+this.name)

}

single.test.prototype.age=18;

single.test.prototype.judgeNum=function(num){
if(num<5){console.log('我比5小')}
else{
    console.log('我比5大')
}
}

single.test.prototype.setNum=function(){

    this.judgeNum(1)
}


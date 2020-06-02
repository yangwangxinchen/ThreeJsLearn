var http = require('http')  //http模块创建服务器
var path = require('path')  //path模块根据系统内部自动识别url类型
var fs = require('fs')  //fs模块用于读写文件
var url = require('url')  //url模块自动解析用户的url得到一些有用的信息

function staticRoot(staticPath,req,res){
	// console.log(url.parse('http://user:pass@host.com:8080/path/to/file?query=string#hash'));
	//将字符串解析为url对象
	var pathObj = url.parse(req.url,true)  //解析request对象中url包含的所有信息
	// console.log(pathObj)

	//添加默认访问页面
	if(pathObj.pathname === '/'){
		pathObj.pathname += 'index.html'
		// console.log(pathObj.pathname)
	}

	//获取资源文件的相对路径  //组合完整的文件路径:当前目录+'pub'+'index.html':
	var filePath = path.join(staticPath,pathObj.pathname)

     //同步读取文件
	// var fileContent = fs.readFileSync(filePath,'binary')
	// res.write(fileContent,'binary')
	// res.end()
	// console.log(filePath)

	fs.readFile(filePath,'binary',function(err,fileContent){
		if(err){  //文件名不存在
			console.log('404')
			res.writeHead(404,'not Found')
			res.end('<h1>Not Found!</h1>')
		}else{  //文件名存在
			// 检测服务器状态
			res.writeHead(200,'okay')
			//响应信息
			res.write(fileContent,'binary')
			//响应结束
			res.end()
		}
	})
}

//自动生成文件的绝对路径，根据绝对路径读取文件
console.log(path.join(__dirname,'static'))   //__dirname代表当前文件所在的文件目录

//文件服务器
var server = http.createServer(function(req,res){
	//根据当前文件目录读取信息
	staticRoot(path.join(__dirname,'static'),req,res) 
})
server.listen(9000)
console.log('Server running at http://127.0.0.1:9000')
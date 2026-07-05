import ImageKit from "imagekit";

const proxyEnvNames = [
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "http_proxy",
    "https_proxy",
    "all_proxy",
]

const suspiciousLocalProxyPattern = /127\.0\.0\.1:9|localhost:9|:9/;

proxyEnvNames.forEach((name)=>{
    if(process.env[name] && suspiciousLocalProxyPattern.test(process.env[name])){
        delete process.env[name]
    }
})

var imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
});

export default imagekit;

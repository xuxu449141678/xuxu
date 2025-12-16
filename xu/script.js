class DotGenerator {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.params = {
            dotSize: 5,
            dotSpacing: 10,
            threshold: 50,
            dotColor: '#ffffff',
            backgroundColor: '#000000',
            dotShape: 'circle',
            reverse: false,
            randomSize: false,
            randomRotation: false
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateCanvas();
    }
    
    setupEventListeners() {
        // 图像上传
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        // 控制参数事件
        const controls = [
            'dotSize', 'dotSpacing', 'threshold', 'dotColor', 'backgroundColor'
        ];
        
        controls.forEach(control => {
            const element = document.getElementById(control);
            element.addEventListener('input', (e) => {
                this.updateParameter(control, e.target.value);
            });
        });
        
        // 形状按钮事件
        const shapeButtons = document.querySelectorAll('.shape-btn');
        shapeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 移除所有按钮的active类
                shapeButtons.forEach(btn => btn.classList.remove('active'));
                // 添加当前按钮的active类
                e.target.closest('.shape-btn').classList.add('active');
                // 更新参数
                const shape = e.target.closest('.shape-btn').dataset.shape;
                this.updateParameter('dotShape', shape);
            });
        });
        
        // 导出按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportImage();
        });
        
        // 导出格式按钮事件
        const formatButtons = document.querySelectorAll('.format-btn');
        formatButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 移除所有按钮的active类
                formatButtons.forEach(btn => btn.classList.remove('active'));
                // 添加当前按钮的active类
                e.target.classList.add('active');
                // 更新导出格式
                this.exportFormat = e.target.dataset.format;
            });
        });
        
        // 反向生成按钮
        document.getElementById('reverseBtn').addEventListener('click', () => {
            this.toggleReverse();
        });
        
        // 大小随机按钮
        document.getElementById('randomSizeBtn').addEventListener('click', () => {
            this.toggleRandomSize();
        });
        
        // 随机旋转按钮
        document.getElementById('randomRotationBtn').addEventListener('click', () => {
            this.toggleRandomRotation();
        });
        
        this.exportFormat = 'png';
    }
    
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            this.image = new Image();
            this.image.onload = () => {
                this.resizeCanvas();
                this.updateCanvas();
                document.getElementById('exportBtn').disabled = false;
            };
            this.image.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    resizeCanvas() {
        const maxWidth = 800;
        const maxHeight = 600;
        
        let width = this.image.width;
        let height = this.image.height;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    updateParameter(name, value) {
        if (name === 'dotSize' || name === 'threshold' || name === 'dotSpacing') {
            this.params[name] = parseFloat(value);
        } else {
            this.params[name] = value;
        }
        
        // 更新显示值
        const valueElement = document.getElementById(name + 'Value');
        if (valueElement) {
            if (name === 'threshold') {
                valueElement.textContent = value + '%';
            } else if (name === 'dotSpacing') {
                valueElement.textContent = value + 'px';
            } else {
                valueElement.textContent = value;
            }
        }
        
        this.updateCanvas();
    }
    
    updateCanvas() {
        const { width, height } = this.canvas;
        
        // 清空画布并设置背景色
        this.ctx.fillStyle = this.params.backgroundColor;
        this.ctx.fillRect(0, 0, width, height);
        
        if (!this.image) {
            // 显示提示信息
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('请选择一张照片', width / 2, height / 2);
            return;
        }
        
        this.generateDots();
    }
    
    generateDots() {
        const { width, height } = this.canvas;
        const { dotSize, dotSpacing, threshold, dotColor, dotShape } = this.params;
        
        // 使用直接的点间距参数
        const spacing = dotSpacing;
        
        // 绘制图像到临时画布进行处理
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 绘制原始图像
        tempCtx.drawImage(this.image, 0, 0, width, height);
        
        // 获取图像数据
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // 绘制点阵 - 优化循环性能
        const thresholdValue = (threshold / 100) * 255;
        
        for (let y = 0; y < height; y += spacing) {
            for (let x = 0; x < width; x += spacing) {
                const index = (Math.floor(y) * width + Math.floor(x)) * 4;
                // 将像素转换为灰度
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                
                // 应用阈值，根据reverse参数决定绘制逻辑
                if (this.params.reverse) {
                    // 反向生成：暗区域绘制点
                    if (gray >= thresholdValue) {
                        continue;
                    }
                } else {
                    // 正常生成：亮区域绘制点
                    if (gray < thresholdValue) {
                        continue;
                    }
                }
                
                // 计算点的不透明度或大小
                const intensity = this.params.reverse ? (255 - gray) / 255 : gray / 255;
                
                // 绘制点
                this.drawDot(x, y, intensity, dotShape, dotColor, dotSize);
            }
        }
    }
    
    drawDot(x, y, intensity, shape, color, size) {
        this.ctx.fillStyle = color;
        
        // 应用随机大小
        let actualSize = intensity * size;
        if (this.params.randomSize) {
            // 生成0.5到1.5之间的随机因子
            const randomFactor = 0.5 + Math.random();
            actualSize *= randomFactor;
        }
        
        // 保存当前画布状态
        this.ctx.save();
        
        // 应用随机旋转
        if (this.params.randomRotation) {
            // 将原点移动到点中心
            this.ctx.translate(x, y);
            // 生成0到360度的随机角度
            const randomRotation = Math.random() * 2 * Math.PI;
            this.ctx.rotate(randomRotation);
            // 将原点移回
            this.ctx.translate(-x, -y);
        }
        
        switch (shape) {
            case 'circle':
                this.drawCircle(x, y, actualSize);
                break;
            case 'square':
                this.drawSquare(x, y, actualSize);
                break;
            case 'triangle':
                this.drawTriangle(x, y, actualSize);
                break;
            case 'pentagon':
                this.drawPentagon(x, y, actualSize);
                break;
            case 'hexagon':
                this.drawHexagon(x, y, actualSize);
                break;
        }
        
        // 恢复画布状态
        this.ctx.restore();
    }
    
    drawCircle(x, y, radius) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawSquare(x, y, size) {
        const halfSize = size / 2;
        this.ctx.fillRect(x - halfSize, y - halfSize, size, size);
    }
    
    drawTriangle(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.lineTo(x - size, y + size);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawPentagon(x, y, size) {
        this.ctx.beginPath();
        const sides = 5;
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawHexagon(x, y, size) {
        this.ctx.beginPath();
        const sides = 6;
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    exportImage() {
        try {
            if (this.exportFormat === 'png') {
                this.exportPNG();
            } else if (this.exportFormat === 'svg') {
                this.exportSVG();
            }
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
        }
    }
    
    toggleReverse() {
        this.params.reverse = !this.params.reverse;
        this.updateCanvas();
        
        // 更新按钮样式
        const reverseBtn = document.getElementById('reverseBtn');
        if (this.params.reverse) {
            reverseBtn.classList.add('active');
            reverseBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
        } else {
            reverseBtn.classList.remove('active');
            reverseBtn.style.background = '';
        }
    }
    
    toggleRandomSize() {
        this.params.randomSize = !this.params.randomSize;
        this.updateCanvas();
        
        // 更新按钮样式
        const randomSizeBtn = document.getElementById('randomSizeBtn');
        randomSizeBtn.classList.toggle('active');
    }
    
    toggleRandomRotation() {
        this.params.randomRotation = !this.params.randomRotation;
        this.updateCanvas();
        
        // 更新按钮样式
        const randomRotationBtn = document.getElementById('randomRotationBtn');
        randomRotationBtn.classList.toggle('active');
    }
    
    exportPNG() {
        const link = document.createElement('a');
        link.download = 'dot-image.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
    
    exportSVG() {
        const { width, height } = this.canvas;
        const { dotSize, dotSpacing, threshold, dotColor, dotShape } = this.params;
        
        // 使用直接的点间距参数
        const spacing = dotSpacing;
        
        // 绘制图像到临时画布进行处理以获取数据
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.image, 0, 0, width, height);
        
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // 生成SVG
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: ${this.params.backgroundColor};">`;
        
        const thresholdValue = (threshold / 100) * 255;
        
        for (let y = 0; y < height; y += spacing) {
            for (let x = 0; x < width; x += spacing) {
                const index = (Math.floor(y) * width + Math.floor(x)) * 4;
                // 将像素转换为灰度
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                
                // 应用阈值，根据reverse参数决定绘制逻辑
                if (this.params.reverse) {
                    // 反向生成：暗区域绘制点
                    if (gray >= thresholdValue) {
                        continue;
                    }
                } else {
                    // 正常生成：亮区域绘制点
                    if (gray < thresholdValue) {
                        continue;
                    }
                }
                
                const intensity = this.params.reverse ? (255 - gray) / 255 : gray / 255;
                let actualSize = intensity * dotSize;
                
                // 应用随机大小
                if (this.params.randomSize) {
                    const randomFactor = 0.5 + Math.random();
                    actualSize *= randomFactor;
                }
                
                // 应用随机旋转
                let rotation = 0;
                if (this.params.randomRotation) {
                    rotation = Math.random() * 360;
                }
                
                // 添加点到SVG
                svg += this.generateSVGElement(x, y, actualSize, dotShape, dotColor, rotation);
            }
        }
        
        svg += '</svg>';
        
        // 导出SVG
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'dot-image.svg';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    generateSVGElement(x, y, size, shape, color, rotation = 0) {
        const transform = rotation !== 0 ? `transform="rotate(${rotation} ${x} ${y})"` : '';
        
        switch (shape) {
            case 'circle':
                return `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" ${transform} />`;
            case 'square':
                const halfSize = size / 2;
                return `<rect x="${x - halfSize}" y="${y - halfSize}" width="${size}" height="${size}" fill="${color}" ${transform} />`;
            case 'triangle':
                return `<polygon points="${x},${y - size} ${x + size},${y + size} ${x - size},${y + size}" fill="${color}" ${transform} />`;
            case 'pentagon':
                let points = '';
                const sides = 5;
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
                    const px = x + Math.cos(angle) * size;
                    const py = y + Math.sin(angle) * size;
                    points += `${px},${py} `;
                }
                return `<polygon points="${points.trim()}" fill="${color}" ${transform} />`;
            case 'hexagon':
                points = '';
                const sidesHex = 6;
                for (let i = 0; i < sidesHex; i++) {
                    const angle = (i * 2 * Math.PI) / sidesHex - Math.PI / 2;
                    const px = x + Math.cos(angle) * size;
                    const py = y + Math.sin(angle) * size;
                    points += `${px},${py} `;
                }
                return `<polygon points="${points.trim()}" fill="${color}" ${transform} />`;
            default:
                return '';
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new DotGenerator();
});
/**
 * PixelCompress PRO - Interactive Canvas Cropper & Compression Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // State Management
    const state = {
        img: null,
        imgSrc: null,
        fileName: 'image',
        origWidth: 0,
        origHeight: 0,
        origSizeBytes: 0,
        
        // Transforms
        cropBox: { x: 0, y: 0, w: 0, h: 0 },
        ratio: 'free',
        rotateAngle: 0,
        flipH: false,
        flipV: false,
        scalePercent: 100,
        exactW: null,
        exactH: null,
        lockAspect: true,

        // Adjustments & Filters
        brightness: 100,
        contrast: 100,
        saturation: 100,
        sharpness: 100,
        blur: 0,
        filterType: 'none',
        
        // Compression
        format: 'JPEG',
        mode: 'quality', // 'quality' or 'target'
        quality: 85,
        targetKB: null,
        keepEXIF: false,
        
        // Viewport
        zoom: 1.0,
        isComparing: false,
        
        // Processed Result
        procB64: null,
        procWidth: 0,
        procHeight: 0,
        procSizeBytes: 0,
        
        // Batch
        batchQueue: []
    };

    // DOM Element References
    const elements = {
        // Drop & File
        dropZone: document.getElementById('dropZone'),
        canvasWorkspace: document.getElementById('canvasWorkspace'),
        mainCanvas: document.getElementById('mainCanvas'),
        cropOverlay: document.getElementById('cropOverlay'),
        hiddenFileInput: document.getElementById('hiddenFileInput'),
        btnOpenFile: document.getElementById('btnOpenFile'),
        btnBrowseDrop: document.getElementById('btnBrowseDrop'),
        btnQuickSave: document.getElementById('btnQuickSave'),
        btnSaveToDisk: document.getElementById('btnSaveToDisk'),
        
        // Controls
        ratioPresets: document.getElementById('ratioPresets'),
        btnRotateLeft: document.getElementById('btnRotateLeft'),
        btnRotateRight: document.getElementById('btnRotateRight'),
        btnFlipH: document.getElementById('btnFlipH'),
        btnFlipV: document.getElementById('btnFlipV'),
        btnResetCrop: document.getElementById('btnResetCrop'),
        
        scaleSlider: document.getElementById('scaleSlider'),
        scaleValueBadge: document.getElementById('scaleValueBadge'),
        inputExactW: document.getElementById('inputExactW'),
        inputExactH: document.getElementById('inputExactH'),
        btnLockAspect: document.getElementById('btnLockAspect'),
        iconLock: document.getElementById('iconLock'),
        btnResetDim: document.getElementById('btnResetDim'),

        brightnessSlider: document.getElementById('brightnessSlider'),
        brightnessValueBadge: document.getElementById('brightnessValueBadge'),
        contrastSlider: document.getElementById('contrastSlider'),
        contrastValueBadge: document.getElementById('contrastValueBadge'),
        saturationSlider: document.getElementById('saturationSlider'),
        saturationValueBadge: document.getElementById('saturationValueBadge'),
        sharpnessSlider: document.getElementById('sharpnessSlider'),
        sharpnessValueBadge: document.getElementById('sharpnessValueBadge'),
        blurSlider: document.getElementById('blurSlider'),
        blurValueBadge: document.getElementById('blurValueBadge'),
        filterPresets: document.getElementById('filterPresets'),
        btnResetAdjust: document.getElementById('btnResetAdjust'),
        
        selectFormat: document.getElementById('selectFormat'),
        modeQuality: document.getElementById('modeQuality'),
        modeTargetKB: document.getElementById('modeTargetKB'),
        containerQuality: document.getElementById('containerQuality'),
        containerTargetKB: document.getElementById('containerTargetKB'),
        qualitySlider: document.getElementById('qualitySlider'),
        qualityValueBadge: document.getElementById('qualityValueBadge'),
        inputTargetKB: document.getElementById('inputTargetKB'),
        switchEXIF: document.getElementById('switchEXIF'),
        
        // View Modes
        viewModeCrop: document.getElementById('viewModeCrop'),
        viewModeCompare: document.getElementById('viewModeCompare'),
        comparisonWorkspace: document.getElementById('comparisonWorkspace'),
        imgBefore: document.getElementById('imgBefore'),
        imgAfter: document.getElementById('imgAfter'),
        afterWrapper: document.getElementById('afterWrapper'),
        comparisonSliderBar: document.getElementById('comparisonSliderBar'),
        comparisonContainer: document.getElementById('comparisonContainer'),
        
        // Metrics
        savingsCard: document.getElementById('savingsCard'),
        savingsPercent: document.getElementById('savingsPercent'),
        savingsSubtext: document.getElementById('savingsSubtext'),
        metricOrigSize: document.getElementById('metricOrigSize'),
        metricOrigDim: document.getElementById('metricOrigDim'),
        metricProcSize: document.getElementById('metricProcSize'),
        metricProcDim: document.getElementById('metricProcDim'),
        metricFormat: document.getElementById('metricFormat'),
        metricQuality: document.getElementById('metricQuality'),
        btnAddToBatch: document.getElementById('btnAddToBatch'),
        
        // Batch
        batchDrawer: document.getElementById('batchDrawer'),
        batchDrawerHeader: document.getElementById('batchDrawerHeader'),
        btnToggleDrawer: document.getElementById('btnToggleDrawer'),
        batchCountBadge: document.getElementById('batchCountBadge'),
        batchItemsContainer: document.getElementById('batchItemsContainer'),
        btnProcessBatch: document.getElementById('btnProcessBatch'),
        btnClearBatch: document.getElementById('btnClearBatch'),
        btnOpenBatch: document.getElementById('btnOpenBatch')
    };

    const ctx = elements.mainCanvas.getContext('2d');

    // ==========================================
    // INITIALIZATION & EVENT LISTENERS
    // ==========================================
    
    function initEvents() {
        // File Loading
        elements.btnOpenFile.addEventListener('click', openFilePicker);
        elements.btnBrowseDrop.addEventListener('click', openFilePicker);
        elements.hiddenFileInput.addEventListener('change', handleFileSelect);

        // Drag & Drop
        elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.dropZone.classList.add('dragover');
        });
        elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('dragover'));
        elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                if (e.dataTransfer.files.length > 1) {
                    handleBatchFiles(Array.from(e.dataTransfer.files));
                } else {
                    loadImageFromFile(e.dataTransfer.files[0]);
                }
            }
        });

        // Ratio Presets
        elements.ratioPresets.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset-btn');
            if (!btn) return;
            elements.ratioPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.ratio = btn.dataset.ratio;
            applyRatioToCropBox();
            triggerProcess();
        });

        // Transformations
        elements.btnRotateLeft.addEventListener('click', () => { state.rotateAngle = (state.rotateAngle - 90) % 360; renderWorkspace(); triggerProcess(); });
        elements.btnRotateRight.addEventListener('click', () => { state.rotateAngle = (state.rotateAngle + 90) % 360; renderWorkspace(); triggerProcess(); });
        elements.btnFlipH.addEventListener('click', () => { state.flipH = !state.flipH; renderWorkspace(); triggerProcess(); });
        elements.btnFlipV.addEventListener('click', () => { state.flipV = !state.flipV; renderWorkspace(); triggerProcess(); });
        elements.btnResetCrop.addEventListener('click', () => { resetCropBox(); triggerProcess(); });

        // Sliders & Inputs
        elements.scaleSlider.addEventListener('input', (e) => {
            state.scalePercent = parseInt(e.target.value);
            elements.scaleValueBadge.textContent = state.scalePercent + '%';
            triggerProcess();
        });

        // Adjustments & Filters
        elements.brightnessSlider.addEventListener('input', (e) => {
            state.brightness = parseInt(e.target.value);
            elements.brightnessValueBadge.value = state.brightness;
            triggerProcess();
        });
        elements.contrastSlider.addEventListener('input', (e) => {
            state.contrast = parseInt(e.target.value);
            elements.contrastValueBadge.value = state.contrast;
            triggerProcess();
        });
        elements.saturationSlider.addEventListener('input', (e) => {
            state.saturation = parseInt(e.target.value);
            elements.saturationValueBadge.value = state.saturation;
            triggerProcess();
        });
        elements.sharpnessSlider.addEventListener('input', (e) => {
            state.sharpness = parseInt(e.target.value);
            elements.sharpnessValueBadge.value = state.sharpness;
            triggerProcess();
        });
        elements.blurSlider.addEventListener('input', (e) => {
            state.blur = parseInt(e.target.value);
            elements.blurValueBadge.value = state.blur;
            triggerProcess();
        });

        // Typed values in the badge inputs sync back to the slider + state
        function bindBadgeInput(badgeEl, sliderEl, stateKey, min, max) {
            badgeEl.addEventListener('input', (e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val)) return; // let them keep typing (e.g. clearing the field)
                val = Math.max(min, Math.min(max, val));
                state[stateKey] = val;
                sliderEl.value = val;
                triggerProcess();
            });
            badgeEl.addEventListener('blur', (e) => {
                // Snap back to a valid number if left empty/invalid
                let val = parseInt(e.target.value);
                if (isNaN(val)) val = state[stateKey];
                val = Math.max(min, Math.min(max, val));
                e.target.value = val;
                state[stateKey] = val;
                sliderEl.value = val;
                triggerProcess();
            });
        }
        bindBadgeInput(elements.brightnessValueBadge, elements.brightnessSlider, 'brightness', 0, 200);
        bindBadgeInput(elements.contrastValueBadge, elements.contrastSlider, 'contrast', 0, 200);
        bindBadgeInput(elements.saturationValueBadge, elements.saturationSlider, 'saturation', 0, 200);
        bindBadgeInput(elements.sharpnessValueBadge, elements.sharpnessSlider, 'sharpness', 0, 200);
        bindBadgeInput(elements.blurValueBadge, elements.blurSlider, 'blur', 0, 20);

        elements.filterPresets.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset-btn');
            if (!btn) return;
            elements.filterPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.filterType = btn.dataset.filter;
            triggerProcess();
        });
        elements.btnResetAdjust.addEventListener('click', () => {
            state.brightness = 100; state.contrast = 100; state.saturation = 100;
            state.sharpness = 100; state.blur = 0; state.filterType = 'none';
            elements.brightnessSlider.value = 100; elements.brightnessValueBadge.value = 100;
            elements.contrastSlider.value = 100; elements.contrastValueBadge.value = 100;
            elements.saturationSlider.value = 100; elements.saturationValueBadge.value = 100;
            elements.sharpnessSlider.value = 100; elements.sharpnessValueBadge.value = 100;
            elements.blurSlider.value = 0; elements.blurValueBadge.value = 0;
            elements.filterPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            elements.filterPresets.querySelector('[data-filter="none"]').classList.add('active');
            triggerProcess();
        });

        // Exact Dimension Handling & Aspect Locking
        elements.btnLockAspect.addEventListener('click', () => {
            state.lockAspect = !state.lockAspect;
            if (state.lockAspect) {
                elements.btnLockAspect.style.borderColor = 'var(--accent-cyan)';
                elements.btnLockAspect.style.color = 'var(--accent-cyan)';
                elements.iconLock.className = 'fa-solid fa-link';
            } else {
                elements.btnLockAspect.style.borderColor = 'var(--border-color)';
                elements.btnLockAspect.style.color = 'var(--text-muted)';
                elements.iconLock.className = 'fa-solid fa-link-slash';
            }
        });

        elements.inputExactW.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || null;
            state.exactW = val;
            if (val && state.lockAspect && state.cropBox.w > 0) {
                const currentRatio = state.cropBox.w / state.cropBox.h;
                state.exactH = Math.round(val / currentRatio);
                elements.inputExactH.value = state.exactH;
            }
            triggerProcess();
        });

        elements.inputExactH.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || null;
            state.exactH = val;
            if (val && state.lockAspect && state.cropBox.h > 0) {
                const currentRatio = state.cropBox.w / state.cropBox.h;
                state.exactW = Math.round(val * currentRatio);
                elements.inputExactW.value = state.exactW;
            }
            triggerProcess();
        });

        document.querySelectorAll('.dim-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'btnResetDim') {
                    state.exactW = null;
                    state.exactH = null;
                    elements.inputExactW.value = '';
                    elements.inputExactH.value = '';
                } else {
                    state.exactW = parseInt(btn.dataset.w);
                    state.exactH = parseInt(btn.dataset.h);
                    elements.inputExactW.value = state.exactW;
                    elements.inputExactH.value = state.exactH;
                }
                triggerProcess();
            });
        });

        elements.selectFormat.addEventListener('change', (e) => {
            state.format = e.target.value;
            elements.metricFormat.textContent = state.format;
            triggerProcess();
        });

        // Mode Toggles
        elements.modeQuality.addEventListener('click', () => {
            state.mode = 'quality';
            elements.modeQuality.classList.add('active');
            elements.modeTargetKB.classList.remove('active');
            elements.containerQuality.classList.remove('hidden');
            elements.containerTargetKB.classList.add('hidden');
            triggerProcess();
        });

        elements.modeTargetKB.addEventListener('click', () => {
            state.mode = 'target';
            elements.modeTargetKB.classList.add('active');
            elements.modeQuality.classList.remove('active');
            elements.containerTargetKB.classList.remove('hidden');
            elements.containerQuality.classList.add('hidden');
            triggerProcess();
        });

        elements.qualitySlider.addEventListener('input', (e) => {
            state.quality = parseInt(e.target.value);
            elements.qualityValueBadge.textContent = state.quality + '%';
            triggerProcess();
        });

        elements.inputTargetKB.addEventListener('change', (e) => {
            state.targetKB = parseInt(e.target.value) || null;
            triggerProcess();
        });

        document.querySelectorAll('.chip-btn').forEach(chip => {
            chip.addEventListener('click', () => {
                const kb = parseInt(chip.dataset.kb);
                state.targetKB = kb;
                elements.inputTargetKB.value = kb;
                if (state.mode !== 'target') elements.modeTargetKB.click();
                else triggerProcess();
            });
        });

        elements.switchEXIF.addEventListener('change', (e) => {
            state.keepEXIF = e.target.checked;
            triggerProcess();
        });

        // View Mode
        elements.viewModeCrop.addEventListener('click', () => {
            state.isComparing = false;
            elements.viewModeCrop.classList.add('active');
            elements.viewModeCompare.classList.remove('active');
            elements.canvasWorkspace.classList.remove('hidden');
            elements.comparisonWorkspace.classList.add('hidden');
        });

        elements.viewModeCompare.addEventListener('click', () => {
            if (!state.img) return;
            state.isComparing = true;
            elements.viewModeCompare.classList.add('active');
            elements.viewModeCrop.classList.remove('active');
            elements.canvasWorkspace.classList.add('hidden');
            elements.comparisonWorkspace.classList.remove('hidden');
            setupComparison();
        });

        // Save & Batch Actions
        elements.btnQuickSave.addEventListener('click', saveOutputImage);
        elements.btnSaveToDisk.addEventListener('click', saveOutputImage);
        elements.btnAddToBatch.addEventListener('click', addToBatch);
        
        elements.batchDrawerHeader.addEventListener('click', () => {
            elements.batchDrawer.classList.toggle('collapsed');
        });
        elements.btnOpenBatch.addEventListener('click', () => {
            elements.hiddenFileInput.click();
        });
        elements.btnClearBatch.addEventListener('click', clearBatch);
        elements.btnProcessBatch.addEventListener('click', processBatchZIP);

        initCropperOverlayEvents();
        initComparisonSliderEvents();
    }

    // ==========================================
    // FILE HANDLING
    // ==========================================

    function openFilePicker() {
        if (window.pywebview && window.pywebview.api) {
            window.pywebview.api.select_files().then(files => {
                if (files && files.length > 0) {
                    if (files.length === 1) {
                        loadImageFromPath(files[0]);
                    } else {
                        handleBatchPaths(files);
                    }
                }
            });
        } else {
            elements.hiddenFileInput.click();
        }
    }

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 1) {
            loadImageFromFile(files[0]);
        } else if (files.length > 1) {
            handleBatchFiles(files);
        }
    }

    function loadImageFromFile(file) {
        state.fileName = file.name.replace(/\.[^/.]+$/, "");
        state.origSizeBytes = file.size;
        const reader = new FileReader();
        reader.onload = (event) => {
            state.imgSrc = event.target.result;
            const img = new Image();
            img.onload = () => {
                state.img = img;
                state.origWidth = img.width;
                state.origHeight = img.height;
                onImageLoaded();
            };
            img.src = state.imgSrc;
        };
        reader.readAsDataURL(file);
    }

    function loadImageFromPath(filePath) {
        fetch('/api/load_file?path=' + encodeURIComponent(filePath))
            .then(res => res.json())
            .then(data => {
                if (data.error) alert(data.error);
                else {
                    state.fileName = data.filename;
                    state.origSizeBytes = data.size_bytes;
                    state.imgSrc = data.image_data;
                    const img = new Image();
                    img.onload = () => {
                        state.img = img;
                        state.origWidth = img.width;
                        state.origHeight = img.height;
                        onImageLoaded();
                    };
                    img.src = state.imgSrc;
                }
            });
    }

    function onImageLoaded() {
        elements.dropZone.classList.add('hidden');
        elements.canvasWorkspace.classList.remove('hidden');
        elements.btnQuickSave.disabled = false;
        elements.btnSaveToDisk.disabled = false;
        elements.btnAddToBatch.disabled = false;
        
        resetCropBox();
        renderWorkspace();
        triggerProcess();
    }

    function resetCropBox() {
        if (!state.img) return;
        state.cropBox = {
            x: 0,
            y: 0,
            w: state.origWidth,
            h: state.origHeight
        };
        applyRatioToCropBox();
    }

    function applyRatioToCropBox() {
        if (!state.img || state.ratio === 'free') return;

        const parts = state.ratio.split(':');
        const rw = parseFloat(parts[0]);
        const rh = parseFloat(parts[1]);
        const targetRatio = rw / rh;

        let w = state.cropBox.w;
        let h = w / targetRatio;

        if (h > state.origHeight) {
            h = state.origHeight;
            w = h * targetRatio;
        }

        state.cropBox.w = Math.round(w);
        state.cropBox.h = Math.round(h);
        state.cropBox.x = Math.max(0, Math.round((state.origWidth - w) / 2));
        state.cropBox.y = Math.max(0, Math.round((state.origHeight - h) / 2));

        updateOverlayStyle();
    }

    // ==========================================
    // CANVAS & CROP OVERLAY
    // ==========================================

    function renderWorkspace() {
        if (!state.img) return;

        elements.mainCanvas.width = state.origWidth;
        elements.mainCanvas.height = state.origHeight;

        ctx.save();
        ctx.clearRect(0, 0, state.origWidth, state.origHeight);

        // Center rotation
        ctx.translate(state.origWidth / 2, state.origHeight / 2);
        ctx.rotate((state.rotateAngle * Math.PI) / 180);
        ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
        ctx.drawImage(state.img, -state.origWidth / 2, -state.origHeight / 2);

        ctx.restore();

        updateOverlayStyle();
    }

    function updateOverlayStyle() {
        const box = state.cropBox;
        const cWidth = elements.mainCanvas.clientWidth || state.origWidth;
        const scaleX = cWidth / state.origWidth;

        elements.cropOverlay.style.left = (box.x * scaleX) + 'px';
        elements.cropOverlay.style.top = (box.y * scaleX) + 'px';
        elements.cropOverlay.style.width = (box.w * scaleX) + 'px';
        elements.cropOverlay.style.height = (box.h * scaleX) + 'px';
    }

    // Interactive Dragging of Crop Overlay
    let isDragging = false;
    let dragHandle = null;
    let startX = 0, startY = 0;
    let startBox = null;

    function initCropperOverlayEvents() {
        const overlay = elements.cropOverlay;

        overlay.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragHandle = e.target.dataset.handle || 'move';
            startX = e.clientX;
            startY = e.clientY;
            startBox = { ...state.cropBox };
            e.stopPropagation();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging || !state.img) return;

            const cWidth = elements.mainCanvas.clientWidth || state.origWidth;
            const scaleFactor = state.origWidth / cWidth;

            const dx = (e.clientX - startX) * scaleFactor;
            const dy = (e.clientY - startY) * scaleFactor;

            let { x, y, w, h } = startBox;

            if (dragHandle === 'move') {
                x = Math.max(0, Math.min(state.origWidth - w, x + dx));
                y = Math.max(0, Math.min(state.origHeight - h, y + dy));
            } else {
                if (dragHandle.includes('e')) w = Math.max(20, Math.min(state.origWidth - x, w + dx));
                if (dragHandle.includes('s')) h = Math.max(20, Math.min(state.origHeight - y, h + dy));
                if (dragHandle.includes('w')) {
                    const nw = Math.max(20, w - dx);
                    x = Math.max(0, x + (w - nw));
                    w = nw;
                }
                if (dragHandle.includes('n')) {
                    const nh = Math.max(20, h - dy);
                    y = Math.max(0, y + (h - nh));
                    h = nh;
                }

                if (state.ratio !== 'free') {
                    const parts = state.ratio.split(':');
                    const targetRatio = parseFloat(parts[0]) / parseFloat(parts[1]);
                    h = Math.round(w / targetRatio);
                }
            }

            state.cropBox = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
            updateOverlayStyle();
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                triggerProcess();
            }
        });
    }

    // ==========================================
    // PROCESSING ENGINE & SERVER API
    // ==========================================

    let processTimeout = null;

    function triggerProcess() {
        if (!state.img) return;

        // Debounce to prevent lag during rapid slider movements
        clearTimeout(processTimeout);
        processTimeout = setTimeout(executeProcessingPipeline, 120);
    }

    function executeProcessingPipeline() {
        const payload = {
            image_data: state.imgSrc,
            crop_box: [state.cropBox.x, state.cropBox.y, state.cropBox.x + state.cropBox.w, state.cropBox.y + state.cropBox.h],
            rotate_angle: state.rotateAngle,
            flip_h: state.flipH,
            flip_v: state.flipV,
            scale_percent: state.scalePercent,
            exact_w: state.exactW,
            exact_h: state.exactH,
            format: state.format,
            quality: state.quality,
            target_kb: state.mode === 'target' ? state.targetKB : null,
            keep_exif: state.keepEXIF,
            brightness: state.brightness,
            contrast: state.contrast,
            saturation: state.saturation,
            sharpness: state.sharpness,
            blur: state.blur,
            filter_type: state.filterType
        };

        fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return;
            }

            state.procB64 = data.image_data;
            state.procWidth = data.processed_width;
            state.procHeight = data.processed_height;
            state.procSizeBytes = data.processed_size_bytes;

            updateMetricsUI(data);

            if (state.isComparing) {
                setupComparison();
            }
        })
        .catch(err => console.error("Processing error:", err));
    }

    function updateMetricsUI(data) {
        elements.metricOrigSize.textContent = formatBytes(state.origSizeBytes);
        elements.metricOrigDim.textContent = `${state.origWidth} x ${state.origHeight} px`;

        elements.metricProcSize.textContent = formatBytes(data.processed_size_bytes);
        elements.metricProcDim.textContent = `${data.processed_width} x ${data.processed_height} px`;

        const savings = data.savings_percent;
        elements.savingsPercent.textContent = (savings >= 0 ? '-' : '+') + Math.abs(savings) + '%';
        elements.savingsSubtext.textContent = savings >= 0 ? "Saved file space" : "Increased file size";
        
        elements.savingsPercent.style.color = savings >= 0 ? "var(--accent-emerald)" : "var(--accent-coral)";

        if (state.mode === 'target') {
            elements.metricQuality.textContent = `Q:${data.quality}% (Scale:${data.scale}%)`;
        } else {
            elements.metricQuality.textContent = `${state.quality}%`;
        }
    }

    // ==========================================
    // SIDE-BY-SIDE COMPARISON SLIDER
    // ==========================================

    function setupComparison() {
        if (!state.imgSrc || !state.procB64) return;

        elements.imgBefore.src = state.imgSrc;
        elements.imgAfter.src = state.procB64;

        elements.afterWrapper.style.width = '50%';
        elements.comparisonSliderBar.style.left = '50%';
    }

    function initComparisonSliderEvents() {
        let isSliding = false;

        const slider = elements.comparisonSliderBar;
        const container = elements.comparisonContainer;

        slider.addEventListener('mousedown', (e) => {
            isSliding = true;
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isSliding) return;
            const rect = container.getBoundingClientRect();
            let offsetX = e.clientX - rect.left;
            offsetX = Math.max(0, Math.min(rect.width, offsetX));

            const pct = (offsetX / rect.width) * 100;
            elements.afterWrapper.style.width = pct + '%';
            slider.style.left = pct + '%';
        });

        window.addEventListener('mouseup', () => { isSliding = false; });
    }

    // ==========================================
    // SAVE & BATCH OPERATIONS
    // ==========================================

    function saveOutputImage() {
        if (!state.procB64) return;

        const ext = state.format.toLowerCase();
        const defaultFilename = `${state.fileName}_optimized.${ext}`;

        if (window.pywebview && window.pywebview.api) {
            window.pywebview.api.save_file(state.procB64, defaultFilename).then(res => {
                if (res && res.success) {
                    alert("Image saved successfully to " + res.path);
                }
            });
        } else {
            const link = document.createElement('a');
            link.href = state.procB64;
            link.download = defaultFilename;
            link.click();
        }
    }

    function addToBatch() {
        if (!state.imgSrc) return;

        state.batchQueue.push({
            id: Date.now(),
            name: state.fileName,
            src: state.imgSrc,
            format: state.format,
            quality: state.quality,
            targetKB: state.targetKB
        });

        updateBatchDrawerUI();
        elements.batchDrawer.classList.remove('collapsed');
    }

    function handleBatchFiles(files) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                state.batchQueue.push({
                    id: Date.now() + Math.random(),
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    src: e.target.result,
                    format: state.format,
                    quality: state.quality,
                    targetKB: state.targetKB
                });
                updateBatchDrawerUI();
            };
            reader.readAsDataURL(file);
        });
        elements.batchDrawer.classList.remove('collapsed');
    }

    function updateBatchDrawerUI() {
        elements.batchCountBadge.textContent = state.batchQueue.length + " files";
        elements.btnProcessBatch.disabled = state.batchQueue.length === 0;

        if (state.batchQueue.length === 0) {
            elements.batchItemsContainer.innerHTML = '<div class="empty-batch-state"><p>No files in batch queue. Drag multiple files or add single images to process together.</p></div>';
            return;
        }

        elements.batchItemsContainer.innerHTML = state.batchQueue.map(item => `
            <div class="batch-item-card" style="display:flex; align-items:center; gap:10px; background:var(--bg-input); padding:8px 12px; border-radius:8px; border:1px solid var(--border-color);">
                <img src="${item.src}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                <div style="font-size:0.75rem;">
                    <div style="font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:120px;">${item.name}</div>
                    <div style="color:var(--text-muted);">${item.format} | ${item.quality}%</div>
                </div>
            </div>
        `).join('');
    }

    function clearBatch() {
        state.batchQueue = [];
        updateBatchDrawerUI();
    }

    function processBatchZIP() {
        if (state.batchQueue.length === 0) return;

        const zip = new JSZip();
        let completed = 0;

        state.batchQueue.forEach(item => {
            const payload = {
                image_data: item.src,
                format: state.format,
                quality: state.quality,
                target_kb: state.targetKB,
                scale_percent: state.scalePercent
            };

            fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                const b64Data = data.image_data.split(',')[1];
                const ext = state.format.toLowerCase();
                zip.file(`${item.name}_compressed.${ext}`, b64Data, { base64: true });
                completed++;

                if (completed === state.batchQueue.length) {
                    zip.generateAsync({ type: 'blob' }).then(blob => {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `Batch_Compressed_Images.zip`;
                        link.click();
                    });
                }
            });
        });
    }

    // Helper Utility
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Start App
    initEvents();
});
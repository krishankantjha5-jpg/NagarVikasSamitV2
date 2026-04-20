import { useEffect, useRef } from 'react';

const WavingFlag = ({ width = 130, height = 87 }) => {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let t = 0;

        const stripes = ['#FF9933', '#FFFFFF', '#138808'];
        const stripeH = height / 3;

        function drawChakra(cx, cy, radius) {
            ctx.save();
            ctx.strokeStyle = '#000080';
            ctx.fillStyle = '#000080';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.12, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 24; i++) {
                const angle = (i / 24) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(cx + radius * 0.15 * Math.cos(angle), cy + radius * 0.15 * Math.sin(angle));
                ctx.lineTo(cx + radius * 0.90 * Math.cos(angle), cy + radius * 0.90 * Math.sin(angle));
                ctx.stroke();
            }
            ctx.restore();
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);
            t += 0.06;

            // Draw each 1-pixel column with vertical wave offset
            for (let x = 0; x < width; x++) {
                const progress = x / width;
                const amplitude = progress * 10;
                const waveY = Math.sin(progress * Math.PI * 2.5 - t) * amplitude;

                for (let s = 0; s < 3; s++) {
                    const baseY = s * stripeH + waveY;
                    ctx.fillStyle = stripes[s];
                    ctx.fillRect(x, baseY, 1, stripeH + 1);
                }
            }

            // Chakra positioned at horizontal centre, wave-shifted
            const cx = width * 0.5;
            const prog = 0.5;
            const chakraWaveY = Math.sin(prog * Math.PI * 2.5 - t) * (prog * 10);
            drawChakra(cx, height / 2 + chakraWaveY, stripeH * 0.38);

            animRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [width, height]);

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {/* Golden flag pole */}
            <div style={{
                width: '5px',
                height: `${height + 18}px`,
                background: 'linear-gradient(180deg, #e8c84a 0%, #9a7200 50%, #e8c84a 100%)',
                borderRadius: '3px',
                flexShrink: 0,
                boxShadow: '1px 0 4px rgba(0,0,0,0.35)',
                marginTop: '-9px',
            }} />
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{ display: 'block', boxShadow: '3px 3px 10px rgba(0,0,0,0.3)' }}
            />
        </div>
    );
};

export default WavingFlag;

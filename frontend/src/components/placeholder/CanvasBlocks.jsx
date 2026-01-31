import { useEffect, useRef } from "react";

const COLORS = [
	"#3B82F6",
	"#22C55E",
	"#F97316",
	"#A855F7",
	"#14B8A6",
	"#E11D48",
	"#F59E0B",
];

const SHAPES = [
	{
		name: "I",
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[3, 0],
		],
	},
	{
		name: "O",
		cells: [
			[0, 0],
			[1, 0],
			[0, 1],
			[1, 1],
		],
	},
	{
		name: "T",
		cells: [
			[0, 0],
			[1, 0],
			[2, 0],
			[1, 1],
		],
	},
	{
		name: "L",
		cells: [
			[0, 0],
			[0, 1],
			[0, 2],
			[1, 2],
		],
	},
	{
		name: "J",
		cells: [
			[1, 0],
			[1, 1],
			[1, 2],
			[0, 2],
		],
	},
	{
		name: "S",
		cells: [
			[1, 0],
			[2, 0],
			[0, 1],
			[1, 1],
		],
	},
	{
		name: "Z",
		cells: [
			[0, 0],
			[1, 0],
			[1, 1],
			[2, 1],
		],
	},
	{
		name: "P",
		cells: [
			[0, 0],
			[1, 0],
			[0, 1],
			[1, 1],
			[0, 2],
		],
	},
];

function getShapeInfo(shape) {
	const maxX = Math.max(...shape.cells.map((c) => c[0]));
	const maxY = Math.max(...shape.cells.map((c) => c[1]));
	const width = maxX + 1;
	const height = maxY + 1;
	const lowestByCol = Array.from({ length: width }, () => 0);

	for (let x = 0; x < width; x += 1) {
		let lowest = 0;
		for (const [cellX, cellY] of shape.cells) {
			if (cellX === x && cellY >= lowest) {
				lowest = cellY;
			}
		}
		lowestByCol[x] = lowest;
	}

	return {
		...shape,
		width,
		height,
		lowestByCol,
	};
}

const SHAPE_INFOS = SHAPES.map(getShapeInfo);

function createPiece(width, height, cellSize) {
	const shapeInfo =
		SHAPE_INFOS[Math.floor(Math.random() * SHAPE_INFOS.length)];
	const pieceWidth = shapeInfo.width * cellSize;
	return {
		x: Math.random() * Math.max(1, width - pieceWidth),
		y: -Math.random() * height,
		vx: (Math.random() - 0.5) * 40,
		vy: 0,
		shape: shapeInfo,
		cellSize,
		color: COLORS[Math.floor(Math.random() * COLORS.length)],
	};
}

export default function CanvasBlocks({ className = "", targetRef = null }) {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let width = 0;
		let height = 0;
		let pieces = [];
		let grid = [];
		let heights = [];
		let cols = 0;
		let rows = 0;
		let cellSize = 18;
		let rafId = 0;
		let lastTime = 0;
		const targetRectRef = { current: null };
		const gravity = 380;
		const restitution = 0.55;

		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			const nextWidth = Math.max(1, rect.width);
			const nextHeight = Math.max(1, rect.height);
			const dpr = window.devicePixelRatio || 1;

			canvas.width = nextWidth * dpr;
			canvas.height = nextHeight * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			width = nextWidth;
			height = nextHeight;

			cellSize = Math.max(16, Math.min(24, Math.floor(width / 38)));
			cols = Math.max(10, Math.floor(width / cellSize));
			rows = Math.max(8, Math.floor((height * 0.28) / cellSize));
			grid = Array.from({ length: rows }, () => Array(cols).fill(null));
			heights = Array(cols).fill(0);

			const targetCount = Math.min(
				10,
				Math.max(5, Math.floor(width / 260)),
			);
			pieces = Array.from({ length: targetCount }, () =>
				createPiece(width, height, cellSize),
			);
		};

		const observer = new ResizeObserver(resize);
		observer.observe(canvas);
		resize();

		const targetElement = targetRef?.current ?? null;
		const updateTargetRect = () => {
			if (!targetElement) {
				targetRectRef.current = null;
				return;
			}
			const canvasRect = canvas.getBoundingClientRect();
			const targetRect = targetElement.getBoundingClientRect();
			targetRectRef.current = {
				x: targetRect.left - canvasRect.left,
				y: targetRect.top - canvasRect.top,
				width: targetRect.width,
				height: targetRect.height,
			};
		};

		updateTargetRect();
		const targetObserver = targetElement
			? new ResizeObserver(updateTargetRect)
			: null;
		if (targetObserver && targetElement) {
			targetObserver.observe(targetElement);
		}

		const drawBlock = (block) => {
			ctx.save();
			ctx.translate(block.x, block.y);
			ctx.fillStyle = block.color;
			ctx.globalAlpha = 0.9;
			ctx.shadowColor = "rgba(15, 23, 42, 0.25)";
			ctx.shadowBlur = 6;
			ctx.shadowOffsetY = 3;
			ctx.fillRect(0, 0, block.cellSize, block.cellSize);
			ctx.shadowColor = "transparent";
			ctx.shadowBlur = 0;
			ctx.shadowOffsetY = 0;
			ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
			ctx.lineWidth = 1;
			ctx.strokeRect(0.5, 0.5, block.cellSize - 1, block.cellSize - 1);
			ctx.restore();
		};

		const intersects = (block, rect) => {
			const pieceWidth = block.shape.width * block.cellSize;
			const pieceHeight = block.shape.height * block.cellSize;
			return (
				block.x + pieceWidth > rect.x &&
				block.x < rect.x + rect.width &&
				block.y + pieceHeight > rect.y &&
				block.y < rect.y + rect.height
			);
		};

		const getLandingInfo = (piece) => {
			const maxCol = Math.max(0, cols - piece.shape.width);
			const baseCol = Math.min(
				maxCol,
				Math.max(0, Math.round(piece.x / piece.cellSize)),
			);

			let landingRow = 0;
			piece.shape.lowestByCol.forEach((lowest, idx) => {
				const colIndex = baseCol + idx;
				if (colIndex < 0 || colIndex >= cols) return;
				const columnHeight = heights[colIndex];
				landingRow = Math.max(landingRow, columnHeight - lowest);
			});

			if (landingRow + piece.shape.height > rows) {
				grid = Array.from({ length: rows }, () => Array(cols).fill(null));
				heights = Array(cols).fill(0);
				landingRow = 0;
			}

			const landingY = height - (landingRow + piece.shape.height) * cellSize;
			return { baseCol, landingRow, landingY };
		};

		const addPieceToStack = (piece, baseCol, landingRow) => {

			for (const [cellX, cellY] of piece.shape.cells) {
				const colIndex = baseCol + cellX;
				const rowIndex = landingRow + cellY;
				if (
					colIndex >= 0 &&
					colIndex < cols &&
					rowIndex >= 0 &&
					rowIndex < rows
				) {
					grid[rowIndex][colIndex] = piece.color;
					heights[colIndex] = Math.max(heights[colIndex], rowIndex + 1);
				}
			}
		};

		const step = (time) => {
			if (!lastTime) lastTime = time;
			const delta = Math.min(0.05, (time - lastTime) / 1000);
			lastTime = time;

			ctx.clearRect(0, 0, width, height);
			updateTargetRect();
			const textRect = targetRectRef.current;

			for (const piece of pieces) {
				piece.vy += gravity * delta;
				piece.y += piece.vy * delta;
				piece.x += piece.vx * delta;

				const pieceWidth = piece.shape.width * piece.cellSize;
				const pieceHeight = piece.shape.height * piece.cellSize;

				if (piece.x < 0) {
					piece.x = 0;
					piece.vx *= -restitution;
				}

				if (piece.x > width - pieceWidth) {
					piece.x = width - pieceWidth;
					piece.vx *= -restitution;
				}

				const { baseCol, landingRow, landingY } = getLandingInfo(piece);

				if (piece.y + pieceHeight >= landingY) {
					piece.y = landingY;
					addPieceToStack(piece, baseCol, landingRow);
					Object.assign(piece, createPiece(width, height, piece.cellSize));
					piece.y = -Math.random() * height * 0.4;
					continue;
				}

				if (textRect && intersects(piece, textRect)) {
					const overlapX =
						Math.min(piece.x + pieceWidth, textRect.x + textRect.width) -
						Math.max(piece.x, textRect.x);
					const overlapY =
						Math.min(piece.y + pieceHeight, textRect.y + textRect.height) -
						Math.max(piece.y, textRect.y);

					if (overlapX < overlapY) {
						if (piece.x < textRect.x + textRect.width / 2) {
							piece.x -= overlapX;
						} else {
							piece.x += overlapX;
						}
						piece.vx *= -restitution;
					} else {
						if (piece.y < textRect.y + textRect.height / 2) {
							piece.y -= overlapY;
						} else {
							piece.y += overlapY;
						}
						piece.vy *= -restitution;
					}
				}

				for (const [cellX, cellY] of piece.shape.cells) {
					drawBlock({
						x: piece.x + cellX * piece.cellSize,
						y: piece.y + cellY * piece.cellSize,
						cellSize: piece.cellSize,
						color: piece.color,
					});
				}
			}

			for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
				for (let colIndex = 0; colIndex < cols; colIndex += 1) {
					const cellColor = grid[rowIndex][colIndex];
					if (!cellColor) continue;
					const cellX = colIndex * cellSize;
					const cellY = height - (rowIndex + 1) * cellSize;
					drawBlock({
						x: cellX,
						y: cellY,
						cellSize,
						color: cellColor,
					});
				}
			}

			rafId = window.requestAnimationFrame(step);
		};

		rafId = window.requestAnimationFrame(step);

		return () => {
			window.cancelAnimationFrame(rafId);
			observer.disconnect();
			if (targetObserver) targetObserver.disconnect();
		};
	}, [targetRef]);

	return (
		<canvas
			ref={canvasRef}
			className={`w-full rounded-xl border border-dashed border-border/60 bg-muted/30 ${className}`}
		/>
	);
}

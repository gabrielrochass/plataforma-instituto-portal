import QRCode from "qrcode";

export function QrCode({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const size = modules.size;
  let path = "";
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      if (modules.get(row, column)) path += `M${column} ${row}h1v1h-1z`;
    }
  }
  return (
    <svg
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}

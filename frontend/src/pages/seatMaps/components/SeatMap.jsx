import { Box, ButtonBase, CircularProgress, Typography } from '@mui/material';

const SEAT_ROWS = Array.from({ length: 10 }, (_, index) => String.fromCharCode(65 + index));
const SEAT_COLUMNS = Array.from({ length: 10 }, (_, index) => index + 1);

const SeatMap = ({ seats, activeSeatCode, isBusy, onSeatClick }) => {
  const seatLookup = new Map(seats.map((seat) => [seat.code, seat]));

  return (
    <Box className="seat-map-board">
      {SEAT_ROWS.map((rowLabel) => (
        <Box key={rowLabel} className="seat-map-board__row">
          <Typography variant="body2" className="seat-map-board__row-label">
            {rowLabel}
          </Typography>
          <Box className="seat-map-board__grid">
            {SEAT_COLUMNS.map((columnNumber) => {
              const seatCode = `${rowLabel}${columnNumber}`;
              const seat = seatLookup.get(seatCode) || {
                code: seatCode,
                label: seatCode,
                status: 'available',
                disabled: false,
              };

              return (
                <ButtonBase
                  key={seatCode}
                  className={`seat-map-seat seat-map-seat--${seat.status}${activeSeatCode === seatCode ? ' seat-map-seat--loading' : ''}`}
                  onClick={() => onSeatClick(seat)}
                  disabled={seat.disabled || isBusy}
                  aria-label={`Seat ${seatCode}`}
                >
                  {activeSeatCode === seatCode ? (
                    <CircularProgress size={16} thickness={5} className="seat-map-seat__spinner" />
                  ) : (
                    seat.label
                  )}
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default SeatMap;

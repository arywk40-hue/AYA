import React, { useState, useEffect } from "react";
import { getTimeRemaining } from "../utils/helpers";
import "./AuctionTimer.css";

const AuctionTimer = ({ endTime, compact = false }) => {
  const [time, setTime] = useState(getTimeRemaining(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (time.expired) {
    return <div className="auction-timer auction-timer--expired">Auction Ended</div>;
  }

  if (compact) {
    return (
      <div className="auction-timer auction-timer--compact">
        <span className="auction-timer__label">Ends in</span>
        <span className="auction-timer__compact-time">
          {time.hours}h {time.minutes}m {time.seconds}s
        </span>
      </div>
    );
  }

  const digits = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Mins", value: time.minutes },
    { label: "Secs", value: time.seconds },
  ];

  return (
    <div className="auction-timer">
      <div className="auction-timer__heading">⏱ Auction Ends In</div>
      <div className="auction-timer__digits">
        {digits.map((d, i) => (
          <div key={d.label} className="auction-timer__block">
            <div className="auction-timer__flip">
              <div className="auction-timer__flip-top">
                <span>{String(d.value).padStart(2, "0")}</span>
              </div>
              <div className="auction-timer__flip-divider" />
              <div className="auction-timer__flip-bottom">
                <span>{String(d.value).padStart(2, "0")}</span>
              </div>
              <div className="auction-timer__flip-glow" />
            </div>
            <span className="auction-timer__block-label">{d.label}</span>
            {i < digits.length - 1 && (
              <span className="auction-timer__separator">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuctionTimer;
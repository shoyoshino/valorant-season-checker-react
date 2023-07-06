import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(''); // .season-selectのvalueを管理
  const seasonSelect = useRef(null);
  const seasonStartTimeRef = useRef(null);
  const seasonEndTimeRef = useRef(null);
  const dayRemaining = useRef(null);

  // ページを開いたときVALORANT APIからシーズン情報を取得
  useEffect(() => {
    fetch('https://valorant-api.com/v1/seasons?language=ja-JP')
      .then((response) => response.json())
      .then((object) => {
        const seasons = object.data;
        const fetchDataPromises = seasons.map((season) => {
          if (season.parentUuid != null) {
            return fetch(`https://valorant-api.com/v1/seasons/${season.parentUuid}?language=ja-JP`)
              .then((response) => response.json())
              .then((parentSeason) => {
                season.displayName = `${parentSeason.data.displayName} ${season.displayName}`;
              });
          }
        });

        Promise.all(fetchDataPromises).then(() => {
          setSeasons(seasons);
          const currentSeason = getCurrentSeason(seasons);
          if (currentSeason) {
            setSelectedSeason(currentSeason.uuid);
            setSeasonTime(currentSeason);
          }
        });
      });
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      const currentSeason = seasons.find((season) => season.uuid === selectedSeason);
      if (currentSeason) {
        setSeasonTime(currentSeason);
        setDayRemaining(currentSeason);
      }
    }
  }, [selectedSeason, seasons]);

  // selectボックスからシーズンを選択したときに発火
  function handleChange(event) {
    const seasonUuid = event.target.value;
    setSelectedSeason(seasonUuid);
    setDayRemaining(seasons);
  }

  // 全シーズンの中から現在のシーズンを見つけて返す
  function getCurrentSeason(seasons) {
    const today = new Date();
    today.setDate(today.getDate() - 1);

    for (let i = 0; i < seasons.length; i++) {
      const season = seasons[i];
      if (new Date(season.startTime) < today && today < new Date(season.endTime) && season.parentUuid !== null) {
        return season;
      }
    }
    return null;
  }

  // シーズンの開始日時と終了日時を画面にセットする
  function setSeasonTime(seasonData) {
    // ISO8601形式を日本時間に変換
    const startTime = new Date(seasonData.startTime);
    const endTime = new Date(seasonData.endTime);

    // 年を取得
    const startTimeYear = startTime.getFullYear();
    const endTimeYear = endTime.getFullYear();

    // 月を取得
    const startTimeMonth = startTime.getMonth() + 1;
    const endTimeMonth = endTime.getMonth() + 1;

    // 日を取得
    const startTimeDate = startTime.getDate();
    const endTimeDate = endTime.getDate();

    // 曜日を数字で取得
    const startTimeDayNum = startTime.getDay();
    const endTimeDayNum = endTime.getDay();

    const dayOfTheWeek = { 0: '日', 1: '月', 2: '火', 3: '水', 4: '木', 5: '金', 6: '土' };

    // 曜日を取得
    const startTimeDay = dayOfTheWeek[startTimeDayNum];
    const endTimeDay = dayOfTheWeek[endTimeDayNum];

    // HTMLに挿入
    seasonStartTimeRef.current.innerText = `${startTimeYear}年${startTimeMonth}月${startTimeDate}日${startTimeDay}曜日から`;
    seasonEndTimeRef.current.innerText = `${endTimeYear}年${endTimeMonth}月${endTimeDate}日${endTimeDay}曜日まで`;
  }

  // シーズンの残り日数を計算する
  function setDayRemaining(seasons) {
    const dayRemainingNum =
      (new Date(seasons.endTime).setHours(0, 0, 0, 0) - new Date(new Date().setHours(0, 0, 0, 0))) /
      1000 /
      60 /
      60 /
      24;

    if (Math.sign(dayRemainingNum) == 0 || Math.sign(dayRemainingNum) == 1) {
      dayRemaining.current.innerText = `${dayRemainingNum}日`;
    } else if (Math.sign(dayRemainingNum) == -1) {
      dayRemaining.current.innerText = '終了したシーズンです';
    }
  }

  return (
    <>
      <div className="h-screen bg-gradient-to-tr from-[#ff4656ee] to-[#0a141eee] to-80%">
        <div className="container max-w-screen-md mx-auto px-5">
          <h1 className="text-4xl font-bold text-white pt-20">VALORANT Season Checker</h1>

          <label className="block mb-2 text-sm font-medium text-gray-900 mt-4">
            <select
              name="seasons"
              className="season-select bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
              onChange={handleChange}
              ref={seasonSelect}
              value={selectedSeason}
            >
              {seasons.map((season) => (
                <option key={season.uuid} value={season.uuid}>
                  {season.displayName}
                </option>
              ))}
            </select>
          </label>

          <section className="mt-10">
            <h2 className="season-start-time text-2xl font-bold text-white">シーズン期間：</h2>
            <div className="season-start-time text-xl font-bold text-white mt-4" ref={seasonStartTimeRef}></div>
            <div className="season-end-time text-xl font-bold text-white mt-2" ref={seasonEndTimeRef}></div>
          </section>

          <section className="mt-10">
            <h2 className="season-start-time text-2xl font-bold text-white">シーズン残り日数：</h2>
            <div className="day-remaining text-xl font-bold text-white mt-2" ref={dayRemaining}></div>
          </section>
        </div>
      </div>
    </>
  );
}

export default App;

// 리액트 import
import{createContext, useContext, useState, useEffect} from 'react';

// 리차트 import
import React, { PureComponent } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css'


// 서버에 데이터를 요청하는 함수
function fetchData() {

  // json url 선언
  const endPoint = 'https://api.odcloud.kr/api/15067442/v1/uddi:f3744dd4-eeee-48af-8bfa-ff5ba2427ac5?page=1&perPage=50&serviceKey=DkOIez19CK8KPQ7NAXAWmrxGloo6Dzw70qjMaDakfJIAQu3liUaNPQO83aGA9Om%2FGk%2FsIZEgyxY0H8sBp%2FLMfg%3D%3D';

  // 자바스크립트에 내장된 fetch()메서드를 사용하여 서버에 데이터를 요청한다
  const promise = fetch(endPoint)
    .then(myJson => myJson.json())
  return promise;
}


// 프로젝트에 필요한 데이터 객체를 구성
const food = [
  {  name: '한식' },
  {  name: '일식' },
  {  name: '중식' },
  {  name: '기타' },
]

// 메인 컴포넌트
export default function App() {

  const [selectedFood, setselectedFood] = useState('한식')
 
  return (
    <>
      {/* top Bar */}
     
      <nav className='top'>
      <span>남동구 착한업소현황</span>
        {food.map(item => (
          <button key={item.name} className="btn" onClick={() => setselectedFood(item.name)}>
            {item.name}
          </button>
        ))}
      </nav>

       {/* 대시보드에 selectedFood변수 전달 */}
      <Dashboard selectedFood={selectedFood}></Dashboard>
    </>
  )
}

// 대시보드
function Dashboard({ selectedFood }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // fetchData함수에 selectedFood변수 전달 -> 다시 data 변수에 저장
    fetchData(selectedFood)
      .then(data => {
        setData(data);
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  if (!data) {
    return <p>fetching data...</p>
  }

  const filteredData = data.data.filter(item => item["유형"].startsWith(selectedFood));
    
  return (
    <>
      {data.totalCount > 0 ? (
        <>
          <div className="mainWrap">
          {/* data를 합성된 컴포넌트에 전달한다 */}
          <Rechart storeData={filteredData} />
          <KakaoMap storesData={filteredData} selectedStores={filteredData}/>
          </div>
        </>
      ) : (
        // 데이터가 없으면 사용자에게 자료가 없다는 것을 알려야 한다
        <p>자료가 없습니다</p>
      )}
    </>
  )
}


// 리차트 (리액트 차트 라이브러리) - CustomizedLabelLineChart 사용
// 차트 내에 가격을 표시해주는 CustomizedLabel 사용
class CustomizedLabel extends PureComponent {
  render(storeData) {
    const { x, y, stroke, value} = this.props;

    return (
      <text x={x} y={y} dy={-10} fill={stroke} fontSize={15} textAnchor="middle">
        {value}
      </text>
    );
  }
}

// 차트 내에서 축 디자인 기능을 하는 CustomizedAxisTick 사용
class CustomizedAxisTick extends PureComponent {
  render() {
    const { x, y, stroke, payload } = this.props;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={15}>
          {payload.value}
        </text>
      </g>
    );
  }
}

function Rechart({storeData}){
  
  //리차트가 요구하는 형식에 맞게 데이터 구성
  const chartData = storeData.map(data => {
    return {
      name : data["업소명"],
      price : data["대표메뉴1가격"]
    }
  })

  return (
  <div className='chart' style={{height:'700px'}}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        width={1000}
        height={300}
        data={chartData}
        margin={{
          top: 20,
          right: 25,
          left: 25,
          bottom: 40,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" height={50} tick={<CustomizedAxisTick />} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="price" stroke="#8884d8" label={<CustomizedLabel />} />
        <Line type="monotone" dataKey="name" stroke="#82ca9d" label={<CustomizedLabel />} />
      </LineChart>
    </ResponsiveContainer>
  </div>
  );
 }


//카카오지도
const { kakao } = window;

function KakaoMap ({storesData,selectedStores}) {

  const [selectedStoreInfo, setSelectedStoreInfo] = useState(null);

  const handleMarkerClick = (store) => {
    setSelectedStoreInfo(store);
  };

  useEffect(() => {
    const container = document.getElementById('myMap');
    const options = {
      center: new kakao.maps.LatLng(35.12, 129.1),
      level: 3
    };
    // 지도를 생성합니다.
    const map = new kakao.maps.Map(container, options);
    // 주소-좌표 변환 객체를 생성합니다.
    const geocoder = new kakao.maps.services.Geocoder();

    // 지도를 재설정할 범위정보를 가지고 있을 LatLngBounds 객체를 생성합니다(지도범위 재설정하기)
    // 맨 처음 지도화면에서 좌표들이 모두 보이도록 재설정할 것
    var bounds = new kakao.maps.LatLngBounds(); 

    // forEach를 사용해서 주소를 좌표로 변환하고, 해당 좌표로 마커와 인포윈도우 표시를 반복
    storesData.forEach(function (store) {

    if (selectedStores.includes(store)) {
      
      // 주소로 좌표를 검색합니다
      geocoder.addressSearch(store["소재지주소"], function(result, status) {
  
        // 정상적으로 검색이 완료됐으면
        if (status === kakao.maps.services.Status.OK) {
  
          var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
  
          // 결과값으로 받은 위치를 마커로 표시합니다
          var marker = new kakao.maps.Marker({
            map: map,
            position: coords
          });
          marker.setMap(map); // 객체의 좌표

          // 마커 클릭시 정보 띄우기
          kakao.maps.event.addListener(marker, 'click', function () {
            handleMarkerClick(store);
          });

          // LatLngBounds 객체에 좌표를 추가합니다
          bounds.extend(coords); //추가한 코드, 현재 코드에서 좌표정보는 point[i]가 아닌 coords이다.
  

          // 인포윈도우로 장소에 대한 설명을 표시합니다
          var infowindow = new kakao.maps.InfoWindow({
            content: '<div class="maker">' + store["업소명"] + '</div>',
          });
          infowindow.open(map, marker);

          kakao.maps.event.addListener(marker, 'mouseover', function() {
            infowindow.open(map, marker);
          });
          
          kakao.maps.event.addListener(marker, 'mouseout', function() {
            infowindow.close();
          });
          
          // 정보 창을 처음에 숨깁니다.
          infowindow.close();

  
          // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
          // map.setCenter(coords); //제거한 코드
          setBounds(); //추가한 코드
        }
      });
    }
  });

    function setBounds() { //추가한 함수
      // LatLngBounds 객체에 추가된 좌표들을 기준으로 지도의 범위를 재설정합니다
      // 이때 지도의 중심좌표와 레벨이 변경될 수 있습니다
      map.setBounds(bounds);
      }
    }, [selectedStores]);

  return (
    <>
    <div id='myMap' style={{ width: '55%',  height: '700px'}}></div>
    
    {selectedStoreInfo && (
        <div className="store-info">
          <h2>{selectedStoreInfo["업소명"]}</h2>
          <h3>{selectedStoreInfo["유형"]}</h3>
          <p>대표메뉴 : {selectedStoreInfo["대표메뉴명1"]}</p>
          <p>가격 : <b>{selectedStoreInfo["대표메뉴1가격"]} 원</b></p>
          <p>주소 : {selectedStoreInfo["소재지주소"]}</p>
          {/* 추가적인 정보 표시 */}
        </div>
      )}
    </>
  );
}
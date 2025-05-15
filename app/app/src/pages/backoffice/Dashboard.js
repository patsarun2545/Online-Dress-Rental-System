import BackOffice from "../../components/BackOffice";
import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement, // เพิ่ม PointElement
  LineElement, // เพิ่ม LineElement
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import config from "../../config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement, // เพิ่ม PointElement
  LineElement, // เพิ่ม LineElement
  Title,
  Tooltip,
  Legend
);

function DashBoard() {
  const [data, setData] = useState(null);
  const [chartType, setChartType] = useState("bar");
  const [totalProducts, setTotalProducts] = useState(null); // state สำหรับจำนวนสินค้าทั้งหมด
  const [rentalProducts, setRentalProducts] = useState(null); // state สำหรับจำนวนสินค้าทั้งหมด
  const [totalCustomers, setTotalCustomers] = useState(null); // state สำหรับจำนวนลูกค้าทั้งหมด
  const [totalOrders, setTotalOrders] = useState(null); // state สำหรับจำนวนออเดอร์ทั้งหมด
  const [totalOrdersPay, setTotalOrdersPay] = useState(null); // state สำหรับจำนวนออเดอร์ทั้งหมดที่จ่ายเงิย
  const [totalOrdersSend, setTotalOrdersSend] = useState(null); // state สำหรับจำนวนออเดอร์ทั้งหมดที่จัดส่ง
  const [totalOrdersReturn, setTotalOrdersReturn] = useState(null); // state สำหรับจำนวนออเดอร์ทั้งหมดที่คืนสินค้า
  const [currentMonthTotal, setCurrentMonthTotal] = useState(null); // State สำหรับยอดขายเดือนนี้
  const [currentYearTotal, setCurrentYearTotal] = useState(null); // State for สำหรับยอดขายปีนี้
  const [todayTotal, setTodayTotal] = useState(null); // State สำหรับยอดขายวันนี้

  const handleChartTypeChange = (type) => {
    setChartType(type);
  };

  const [options] = useState({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "ข้อมูลการเช่ารายเดือน",
        font: {
          size: 18,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ฿${context.raw.toLocaleString()}`;
          },
        },
      },
      datalabels: {
        display: true,
        color: "#333",
        anchor: "end",
        align: "end",
        formatter: function (value) {
          return `฿${value.toLocaleString()}`;
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 14,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 14,
          },
        },
        afterDataLimits: (axis) => {
          axis.max = axis.max + 100;
        },
      },
    },
  });

  // เพิ่ม plugin datalabels ใน ChartJS
  ChartJS.register({
    id: "customDatalabels",
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart;
      ctx.save();
      data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        meta.data.forEach((bar, index) => {
          const value = dataset.data[index];
          ctx.fillStyle = "#333";
          ctx.font = "14px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`฿${value.toLocaleString()}`, bar.x, bar.y - 10);
        });
      });
      ctx.restore();
    },
  });

  const fetchChartData = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/sale/dashboard",
        config.headers()
      );
      let chartData = [];

      if (res.data.results !== undefined) {
        for (let i = 0; i < res.data.results.length; i++) {
          chartData.push(res.data.results[i].totalPrice);
        }
      }

      setData({
        labels: [
          "มกราคม",
          "กุมภาพันธ์",
          "มีนาคม",
          "เมษายน",
          "พฤษภาคม",
          "มิถุนายน",
          "กรกฎาคม",
          "สิงหาคม",
          "กันยายน",
          "ตุลาคม",
          "พฤศจิกายน",
          "ธันวาคม",
        ],
        datasets: [
          {
            label: "ยอดเช่ารายเดือน",
            data: chartData,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            hoverBackgroundColor: "rgba(75, 192, 192, 0.8)",
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const fetchTotalProducts = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/product/dashboard/total-products",
        config.headers()
      );
      setTotalProducts(res.data.totalProducts);
    } catch (error) {
      console.error("Error fetching total products:", error);
    }
  };
  const fetchRentalProducts = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/product/dashboard/Includes-rental-products",
        config.headers()
      );
      setRentalProducts(res.data.totalProducts);
    } catch (error) {
      console.error("Error fetching total products:", error);
    }
  };

  const fetchCustomerCount = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/dashboard/customers/count",
        config.headers()
      );
      setTotalCustomers(res.data.count);
    } catch (error) {
      console.error("Error fetching total customers:", error);
    }
  };

  const fetchTotalOrders = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/sale/orderCountDashboard",
        config.headers()
      );
      setTotalOrders(res.data.totalOrderCount);
    } catch (error) {
      console.error("Error fetching total orders:", error);
    }
  };
  const fetchTotalOrdersPay = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/sale/orderpayDashboard",
        config.headers()
      );
      setTotalOrdersPay(res.data.totalOrdersPay);
    } catch (error) {
      console.error("Error fetching total orders:", error);
    }
  };
  const fetchTotalOrdersSend = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/sale/ordersendDashboard",
        config.headers()
      );
      setTotalOrdersSend(res.data.totalOrdersSend);
    } catch (error) {
      console.error("Error fetching total orders:", error);
    }
  };
  const fetchTotalOrdersReturn = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/sale/orderreturnDashboard",
        config.headers()
      );
      setTotalOrdersReturn(res.data.totalOrdersReturn);
    } catch (error) {
      console.error("Error fetching total orders:", error);
    }
  };
  const fetchCurrentMonthTotal = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/sale/currentMonthTotal",
        config.headers()
      );
      setCurrentMonthTotal(res.data.totalPrice);
    } catch (error) {
      console.error("Error fetching current month total:", error);
    }
  };
  const fetchCurrentYearTotal = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/sale/currentYearTotal",
        config.headers()
      );
      setCurrentYearTotal(res.data.totalPrice);
    } catch (error) {
      console.error("Error fetching current year total:", error);
    }
  };
  const fetchTodayTotal = async () => {
    try {
      const res = await axios.get(
        config.apiPath + "/api/sale/todayTotal",
        config.headers()
      );
      setTodayTotal(res.data.totalPrice);
    } catch (error) {
      console.error("Error fetching today's total:", error);
    }
  };

  useEffect(() => {
    fetchChartData();
    fetchTotalProducts();
    fetchRentalProducts();
    fetchCustomerCount(); // เรียกฟังก์ชันนี้เพื่อดึงจำนวนลูกค้า
    fetchTotalOrders(); // เรียกฟังก์ชันนี้เพื่อดึงจำนวนออเดอร์ทั้งหมด
    fetchTotalOrdersPay();
    fetchTotalOrdersSend();
    fetchTotalOrdersReturn();
    fetchCurrentMonthTotal();
    fetchCurrentYearTotal();
    fetchTodayTotal();
  }, []);

  return (
    <BackOffice>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f9f9f9",
          padding: "20px",
        }}
      >
        {/* ส่วนข้อมูลสรุป */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            width: "100%",
            maxWidth: "1200px",
            marginBottom: "40px",
          }}
        >
          {[
            { title: "ออเดอร์ทั้งหมด", value: totalOrders, filter: "" },
            {
              title: "ออเดอร์ที่ชำระเงิน",
              value: totalOrdersPay,
              filter: "pay",
            },
            {
              title: "ออเดอร์ที่จัดส่ง",
              value: totalOrdersSend,
              filter: "send",
            },
            {
              title: "ออเดอร์ที่คืนสินค้า",
              value: totalOrdersReturn,
              filter: "approved",
            },
            
            { title: "ยอดเช่าวันนี้", value: todayTotal },
            { title: "ยอดเช่าเดือนนี้", value: currentMonthTotal },
            { title: "ยอดเช่าปีนี้", value: currentYearTotal },
            {
              title: "ลูกค้าทั้งหมด",
              value: totalCustomers,
              filter: "customer",
            },
            { title: "สินค้าพร้อมเช่า", value: totalProducts, filter: "use" }, // เพิ่ม filter สำหรับสินค้าพร้อมเช่า
            {
              title: "สินค้าติดเช่า",
              value: rentalProducts,
              filter: "reserved",
            }, // เพิ่ม filter สำหรับสินค้าติดเช่า
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: "20px",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
                cursor: item.filter !== undefined ? "pointer" : "default", // ตรวจสอบว่ามี filter หรือไม่
              }}
              onClick={() => {
                if (item.filter !== undefined) {
                  const targetUrl =
                    item.filter === "use" || item.filter === "reserved"
                      ? `/product?status=${item.filter}`
                      : item.filter === "customer"
                      ? `/customer`
                      : item.filter === "approved"
                      ? `/billsale?filter=approved` // ลิงก์ไปหน้า billsale พร้อมฟิลเตอร์คืนสินค้า
                      : `/billsale?filter=${item.filter}`;
                  window.location.href = targetUrl;
                }
              }}              
            >
              <p
                style={{
                  margin: "0",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                {item.value !== null ? item.value : "Loading..."}
              </p>
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "10px 0 0",
                  fontSize: "18px",
                  color: "#555",
                }}
              >
                {item.title}
                <i
                  className={`${
                    [
                      "fas fa-shopping-cart",
                      "fas fa-money-check-alt",
                      "fas fa-shipping-fast",
                      "fas fa-undo",
                      "fas fa-chart-line",
                      "fas fa-chart-line",
                      "fas fa-chart-line",
                      "fas fa-users",
                      "fas fa-box-open",
                      "fas fa-box",
                    ][idx]
                  }`}
                  style={{
                    marginLeft: "8px",
                    fontSize: "18px",
                    color: "#555",
                  }}
                ></i>
              </h3>
            </div>
          ))}
        </div>

        {/* ส่วนแสดงกราฟ */}
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            height: "500px",
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {data ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "20px",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => handleChartTypeChange("bar")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      chartType === "bar" ? "#4caf50" : "#f1f1f1",
                    color: chartType === "bar" ? "#fff" : "#333",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    transition: "background-color 0.3s, color 0.3s",
                  }}
                >
                  แผนภูมิแท่ง
                </button>
                <button
                  onClick={() => handleChartTypeChange("line")}
                  style={{
                    padding: "10px 20px",
                    backgroundColor:
                      chartType === "line" ? "#4caf50" : "#f1f1f1",
                    color: chartType === "line" ? "#fff" : "#333",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    transition: "background-color 0.3s, color 0.3s",
                  }}
                >
                  กราฟเส้น
                </button>
              </div>
              <div style={{ flex: 1 }}>
                {chartType === "bar" ? (
                  <Bar data={data} options={options} />
                ) : (
                  <Line data={data} options={options} />
                )}
              </div>
            </>
          ) : (
            <p style={{ textAlign: "center", fontSize: "16px" }}>Loading...</p>
          )}
        </div>
      </div>
    </BackOffice>
  );
}

export default DashBoard;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import BackOffice from "../components/BackOffice";
import config from "../config";
import "./carts.css";
import { Link } from "react-router-dom";

function Carts() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [customer, setCustomer] = useState({
    id: null, // Initialize with null or appropriate default
    name: "",
    phone: "",
    address: "",
  });
  const [transferDate, setTransferDate] = useState("");
  const [transferTime, setTransferTime] = useState("");
  const [transferAccountName, setTransferAccountName] = useState("");
  const [transferBankName, setTransferBankName] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [rentalOptions, setRentalOptions] = useState([]);
  const [selectedRentalDays, setSelectedRentalDays] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]); // State สำหรับบัญชีธนาคาร
  const [deliveryMethod, setDeliveryMethod] = useState("pickup"); // pickup | delivery

  useEffect(() => {
    // ตรวจสอบการล็อกอิน
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("กรุณาเข้าสู่ระบบก่อน", "กรุณาเข้าสู่ระบบก่อน", "warning");
      navigate("/singin");
      return;
    }

    // ดึงข้อมูลผู้ใช้
    fetchCustomerData(token);

    fetchBankAccounts(); // เรียกใช้งานฟังก์ชันโหลดข้อมูลบัญชีธนาคาร

    // โหลดข้อมูลตะกร้าจาก localStorage
    const savedCart = JSON.parse(localStorage.getItem("carts")) || [];
    setCart(savedCart);
  }, [navigate]);

  useEffect(() => {
    const fetchRentalDays = async () => {
      try {
        const res = await axios.get(`${config.apiPath}/api/rental-days`);
        setRentalOptions(res.data.results); // เก็บข้อมูลใน State
        setSelectedRentalDays(res.data.results[0]?.days || null); // เลือกค่าดีฟอลต์
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลวันเช่า:", error);
        Swal.fire("Error", "ดึงข้อมูลวันที่เช่าไม่สำเร็จ", "error");
      }
    };

    fetchRentalDays();
  }, []);

  useEffect(() => {
    if (selectedRentalDays) {
      // คำนวณวันที่คืนสินค้าโดยใช้ dayjs
      const newReturnDate = dayjs()
        .add(selectedRentalDays, "day")
        .toISOString();
      setReturnDate(newReturnDate);
    }
  }, [selectedRentalDays]);

  const fetchBankAccounts = async () => {
    try {
      const res = await axios.get(config.apiPath + "/api/account/list");
      // กรองบัญชีที่มีสถานะ active
      const activeAccounts = res.data.results.filter(
        (account) => account.status === "use"
      );
      setBankAccounts(activeAccounts); // เก็บเฉพาะบัญชี active ใน state
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลบัญชีธนาคาร:", error);
      Swal.fire("Error", "ดึงข้อมูลบัญชีธนาคารไม่สำเร็จ", "error");
    }
  };

  const fetchCustomerData = async (token) => {
    try {
      const res = await axios.get(config.apiPath + "/api/info", {
        headers: { Authorization: token },
      });
      setCustomer({
        id: res.data.id, // Assuming the API response contains id
        name: res.data.name,
        phone: res.data.phone || "ไม่ระบุ",
        address: res.data.address || "ไม่ระบุ",
      });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า:", error);
      Swal.fire("Error", "ดึงข้อมูลลูกค้าไม่สำเร็จ", "error");
    }
  };

  const removeFromCart = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1); // Remove the item at the specified index
    setCart(updatedCart); // Update the state
    localStorage.setItem("carts", JSON.stringify(updatedCart)); // Update localStorage
  };

  const handleSave = async () => {
    if (cart.length === 0) {
      Swal.fire({
        title: "ไม่มีสินค้าในตะกร้า",
        text: "กรุณาเพิ่มสินค้าลงในตะกร้าก่อนชำระเงิน",
        icon: "warning",
        timer: 1000,
        showConfirmButton: false,
      });
      return;
    }

    if (
      !transferDate ||
      !transferTime ||
      !transferAccountName ||
      !transferBankName ||
      !returnDate
    ) {
      Swal.fire({
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณากรอกข้อมูลการโอนเงินให้ครบถ้วน",
        icon: "warning",
        timer: 1000,
        showConfirmButton: false,
      });
      return;
    }

    setIsSaving(true);
    const customerId = customer.id;
    const payDate = new Date().toISOString().split("T")[0];
    const payTime = new Date().toLocaleTimeString("th-TH");

    // คำนวณราคาทั้งหมดของสินค้าใน cart โดยรวมจำนวนวันเช่า
    const updatedCart = cart.map((item) => ({
      ...item,
      discount:
        rentalOptions.find((opt) => opt.days === selectedRentalDays)
          ?.discount || 0,
    }));

    const transferInfo = {
      transferDate,
      transferTime,
      transferAccountName,
      transferBankName,
      returnDate,
      rentalDays: selectedRentalDays,
      deliveryMethod: deliveryMethod, // Add delivery method
      shippingFee: calculateShippingFee(), // Add shipping fee
    };

    try {
      const payload = {
        customerId,
        payDate,
        payTime,
        carts: updatedCart, // ใช้ cart ที่คำนวณแล้ว
        transferInfo,
        totalDeposit: calculateTotalDeposit(),
        shippingFee: calculateShippingFee(), // Add shipping fee as a separate field
        deliveryMethod: deliveryMethod, // Add delivery method as a separate field
      };

      const res = await axios.post(`${config.apiPath}/api/sale/save`, payload);

      if (res.status === 200 && res.data.message === "success") {
        Swal.fire({
          title: "ยืนยันการซื้อสำเร็จ!",
          text: "ระบบได้บันทึกข้อมูลการซื้อของคุณเรียบร้อยแล้ว",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });

        setCart([]);
        localStorage.removeItem("carts");
        navigate("/orders");
      } else {
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: res.data.error || "ไม่สามารถยืนยันการซื้อได้",
          icon: "error",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error saving cart:", error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถยืนยันการซื้อได้ กรุณาลองอีกครั้ง",
        icon: "error",
        timer: 1000,
        showConfirmButton: false,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotalPrice = () => {
    // คำนวณราคาต่อสินค้าแต่ละชิ้น
    const totalPrice = cart.reduce((total, item) => {
      const discount =
        rentalOptions.find((option) => option.days === selectedRentalDays)
          ?.discount || 0;

      // คำนวณราคาต่อชิ้น (รวมส่วนลด) และปัดเศษ
      const itemTotalPrice = Math.ceil(
        item.price * (item.quantity || 1) * selectedRentalDays * (1 - discount)
      );

      return total + itemTotalPrice; // รวมราคาที่ปัดเศษแล้ว
    }, 0);

    return totalPrice; // ส่งคืนราคาที่รวมแล้ว
  };

  const calculateTotalDiscount = () => {
    // คำนวณส่วนลดทั้งหมดของสินค้าในตะกร้า
    const totalDiscount = cart.reduce((total, item) => {
      const discount =
        rentalOptions.find((option) => option.days === selectedRentalDays)
          ?.discount || 0;

      // คำนวณส่วนลดสำหรับแต่ละสินค้าและปัดเศษ
      const itemDiscount = Math.floor(
        item.price * (item.quantity || 1) * selectedRentalDays * discount
      );

      return total + itemDiscount; // รวมส่วนลดที่ปัดเศษแล้ว
    }, 0);

    return totalDiscount; // ส่งคืนส่วนลดรวมทั้งหมด
  };

  const calculateTotalDeposit = () => {
    return cart.reduce((total, item) => {
      return total + (item.deposit || 0) * (item.quantity || 1);
    }, 0);
  };

  const calculateShippingFee = () => {
    if (deliveryMethod === "pickup") {
      return 0; // รับเอง = ค่าจัดส่ง 0
    }

    // ค้นหาค่าจัดส่งตามจำนวนวันเช่าที่เลือก
    const shippingFee =
      rentalOptions.find((option) => option.days === selectedRentalDays)
        ?.shippingFee || 0;

    return Math.ceil(shippingFee); // ปัดเศษขึ้น
  };

  const formattedDate = returnDate
    ? dayjs(returnDate).format("DD/MM/YYYY") // แปลงเป็นฟอร์แมต DD/MM/YYYY
    : "";

  return (
    <BackOffice>
      <div className="container mt-4">
        <div
          className="cart-container d-flex p-4 rounded shadow-sm bg-white"
          style={{ gap: "20px" }}
        >
          {/* Product List: Left Side */}
          <div className="cart-left">
            <div className="cart-header mb-4 text-center">
              <h4 className="font-weight-bold">🛒 รายการสินค้า</h4>
            </div>
            {cart.length > 0 ? (
              <div className="cart-details">
                {cart.map((item, index) => (
                  <div
                    className="product-row d-flex align-items-center mb-3 p-2 bcart rounded"
                    key={index}
                  >
                    <Link
                      to={`/product/${item.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <img
                        className="product-image mr-3 rounded"
                        src={
                          item.images && item.images[0]?.url
                            ? `${config.apiPath}/uploads/${item.images[0].url}`
                            : "default_image.jpg"
                        }
                        alt={item.name}
                        style={{ width: "100px", height: "100px" }}
                      />
                    </Link>
                    <div className="product-info flex-grow-1 ms-3">
                      <p className="product-name mb-1">
                        <strong>ชื่อสินค้า:</strong> {item.name}
                      </p>
                      <p className="product-price mb-1 text-muted">
                        ราคา: ฿{item.price.toLocaleString("th-TH")}
                      </p>
                      <p className="product-price mb-1 text-muted">
                        ค่ามัดจำ: ฿{item.deposit.toLocaleString("th-TH")}
                      </p>
                      <p className="product-quantity mb-0">
                        จำนวน: {item.quantity || 1}
                      </p>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeFromCart(index)}
                    >
                      <i className="fas fa-trash-alt"></i> ลบสินค้า
                    </button>
                  </div>
                ))}
                {/* Total Price under Product List */}
                <div className="total-price mt-4 d-flex flex-column align-items-center">
                  <div className="form-group w-75">
                    <h5 className="mb-3 font-weight-bold text-center">
                      ระยะเวลาเช่า (วัน)
                    </h5>
                    <select
                      className="form-select mt-2 text-center"
                      value={selectedRentalDays}
                      onChange={(e) =>
                        setSelectedRentalDays(parseInt(e.target.value))
                      }
                    >
                      {rentalOptions.map((option) => (
                        <option key={option.id} value={option.days}>
                          เช่า {option.days} วัน{" "}
                          {option.discount
                            ? `ส่วนลด ${option.discount * 100}%`
                            : ""}{" "}
                          {option.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group w-75 mt-3 text-center">
                    <h5 className="mb-3 font-weight-bold text-center">
                      วิธีการรับสินค้า
                    </h5>
                    <div className="d-flex justify-content-center gap-3">
                      {/* ปุ่มรับเอง */}
                      <button
                        className={`btn w-50 ${
                          deliveryMethod === "pickup"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => setDeliveryMethod("pickup")}
                      >
                        รับเอง (ฟรี)
                      </button>

                      {/* ปุ่มจัดส่ง */}
                      <button
                        className={`btn w-50 ${
                          deliveryMethod === "delivery"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => setDeliveryMethod("delivery")}
                      >
                        จัดส่ง ({calculateShippingFee()} บาท)
                      </button>
                    </div>
                  </div>

                  <div className="form-group w-75 mt-3 text-center">
                    <h5 className="mb-3 font-weight-bold">วันที่คืนสินค้า</h5>
                    <input
                      type="text"
                      className="form-control text-center"
                      value={formattedDate}
                      readOnly
                    />
                  </div>

                  <div className="cart-summary text-center mt-4 p-4 border rounded  bg-white container">
                    <h4 className="fw-bold text-dark mb-3">สรุปการเช่า</h4>
                    <hr />
                    <div className="row">
                      <div className="col-12">
                        <table className="table table-borderless text-start">
                          <tbody>
                            <tr>
                              <td className="fw-bold">จำนวนสินค้าที่เช่า</td>
                              <td className="text-primary text-end">
                                {cart.length} รายการ
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">ส่วนลด</td>
                              <td className="text-danger text-end">
                                {calculateTotalDiscount().toLocaleString(
                                  "th-TH"
                                )}{" "}
                                บาท
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">ราคาหักส่วนลด</td>
                              <td className="text-danger text-end">
                                {calculateTotalPrice().toLocaleString("th-TH")}{" "}
                                บาท
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">ค่ามัดจำรวม</td>
                              <td className="text-danger text-end">
                                {calculateTotalDeposit().toLocaleString(
                                  "th-TH"
                                )}{" "}
                                บาท
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">ค่าจัดส่ง</td>
                              <td className="text-danger text-end">
                                {calculateShippingFee().toLocaleString("th-TH")}{" "}
                                บาท
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="text-danger text-center"
                                colSpan="2"
                              >
                                ***ค่ามัดจำได้หลังคืนหลังคืนสินค้าสำเร็จ***
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <hr />
                    <div className="row">
                      <div className="col-12 d-flex justify-content-between">
                        <h5 className="fw-bold text-dark">รวมราคาทั้งหมด</h5>
                        <h5 className="text-success">
                          {(
                            calculateTotalPrice() +
                            calculateTotalDeposit() +
                            calculateShippingFee()
                          ).toLocaleString("th-TH")}{" "}
                          บาท
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-5">
                <h5 className="text-muted">ไม่มีสินค้าในตะกร้า</h5>
              </div>
            )}
          </div>

          {/* Payment Information: Right Side */}
          <div className="cart-right">
            <div className="cart-header mb-4 text-center">
              <h4 className="font-weight-bold">💳 ชำระเงิน</h4>
            </div>
            <div className="bank-info mb-4 p-3 rounded bcart">
              <h5 className="mb-3 font-weight-bold">🏦 บัญชีธนาคาร</h5>
              {bankAccounts.length > 0 ? (
                bankAccounts.map((account) => (
                  <div key={account.id} className="mb-3">
                    <p>
                      <strong>ธนาคาร :</strong> {account.bankName}
                    </p>
                    <p>
                      <strong>ชื่อบัญชี :</strong> {account.accountName}
                    </p>
                    <p>
                      <strong>เลขบัญชี :</strong> {account.accountNumber}
                    </p>
                  </div>
                ))
              ) : (
                <p>ไม่มีบัญชีธนาคารที่จะแสดง</p>
              )}
            </div>
            <div className="transfer-info mb-4 p-3 rounded bcart">
              <h5 className="mb-3 font-weight-bold">📋 ข้อมูลการชำระเงิน</h5>
              <div className="form-group">
                <label>วันที่โอนเงิน</label>
                <input
                  type="date"
                  className="form-control"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>เวลาที่โอนเงิน</label>
                <input
                  type="time"
                  className="form-control"
                  value={transferTime}
                  onChange={(e) => setTransferTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>ชื่อบัญชีลูกค้า</label>
                <input
                  type="text"
                  className="form-control"
                  value={transferAccountName}
                  onChange={(e) => setTransferAccountName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>ชื่อธนาคารลูกค้า</label>
                <input
                  type="text"
                  className="form-control"
                  value={transferBankName}
                  onChange={(e) => setTransferBankName(e.target.value)}
                />
              </div>
            </div>
            <div className="cart-footer text-center">
              <button
                className="btn btn-success btn-lg btn-block"
                onClick={handleSave}
                disabled={isSaving}
              >
                {/* เพิ่มไอคอน */}
                <i
                  className={`fa ${
                    isSaving ? "fa-spinner fa-spin" : "fa-credit-card"
                  }`}
                  style={{ marginRight: "10px" }}
                ></i>
                {isSaving ? "กำลังบันทึก..." : "ชำระเงิน"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </BackOffice>
  );
}

export default Carts;

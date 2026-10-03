/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: TỰ ĐỘNG ĐỒNG BỘ SEPAY (VIETCOMBANK) -> BẢNG VÀNG DONATE
 * Tác giả: ĐĂNG LIO • DRAGON EDITION
 * ==============================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT TRONG 2 PHÚT (HOÀN TOÀN MIỄN PHÍ - KHÔNG CẦN THUÊ SERVER):
 * 
 * BƯỚC 1: TẠO GOOGLE SHEET
 *   1. Mở trình duyệt truy cập: https://sheets.new để tạo một trang tính mới.
 *   2. Đặt tên trang tính là: "Lịch Sử Donate Đăng Lio".
 * 
 * BƯỚC 2: DÁN ĐOẠN CODE NÀY VÀO APPS SCRIPT
 *   1. Trên Google Sheets, bấm menu "Tiện ích mở rộng" (Extensions) -> chọn "Apps Script".
 *   2. Xóa hết code mặc định trong đó và dán toàn bộ file này vào.
 *   3. Bấm biểu tượng "Lưu" (Ctrl+S / Cmd+S).
 * 
 * BƯỚC 3: TRIỂN KHAI THÀNH WEB APP CÔNG KHAI
 *   1. Ở góc trên bên phải, bấm nút "Triển khai" (Deploy) -> chọn "Tùy chọn triển khai mới" (New deployment).
 *   2. Bấm vào icon bánh răng (Select type) -> chọn "Ứng dụng web" (Web app).
 *   3. Thiết lập chính xác như sau:
 *      - Mô tả: "Sepay Donate Bridge"
 *      - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *      - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)   <-- RẤT QUAN TRỌNG!
 *   4. Bấm "Triển khai" (Deploy). Google sẽ hỏi cấp quyền, bấm "Ủy quyền truy cập" (Authorize),
 *      chọn email Google của bạn, bấm "Nâng cao" (Advanced) -> "Đi tới (không an toàn)".
 *   5. Sao chép "URL ứng dụng web" (Link có đuôi /exec).
 * 
 * BƯỚC 4: KẾT NỐI VỚI SEPAY VÀ TRANG WEB
 *   1. Trên SePay.vn: Vào mục "Webhooks" -> "Thêm Webhook", dán link Web App vừa copy vào ô Webhook URL.
 *   2. Trong file index.html của bạn: Dán link Web App này vào biến CONFIG.syncEndpoint.
 * 
 * XONG! Khi có ai chuyển khoản thật vào Vietcombank, tiền về sẽ tự động:
 * - Lưu 1 dòng vĩnh viễn vào Google Sheet của bạn.
 * - Tự động nổ pháo hoa trên màn hình người chuyển nếu đang mở QR.
 * - Tự động hiện tên người đó lên BẢNG VÀNG cho toàn bộ mọi người cùng xem!
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    // Kiểm tra dữ liệu chuyển khoản từ SePay
    // Các trường SePay gửi qua: transferType ('in'), transferAmount, content, transactionDate, referenceCode
    if (data.transferType === "in" || data.transferAmount > 0) {
      var sheet = getOrCreateSheet();
      
      var now = new Date();
      var dateStr = Utilities.formatDate(now, "Asia/Ho_Chi_Minh", "yyyy-MM-dd HH:mm:ss");
      var amount = Number(data.transferAmount) || 0;
      var rawContent = data.content || "";
      var refCode = data.referenceCode || data.id || "";
      
      // Trích xuất mã phiên CUUDANG_XXXX
      var codeMatch = rawContent.match(/CUUDANG[_\s]*([A-Z0-9]+)/i);
      var sessionCode = codeMatch ? ("CUUDANG_" + codeMatch[1].toUpperCase()) : "";
      
      // Bóc tách lời nhắn từ nội dung chuyển khoản
      var cleanMsg = rawContent.replace(/CUUDANG[_\s]*[A-Z0-9]+/i, "").trim();
      if (!cleanMsg) {
        cleanMsg = "Tiếp thêm linh lực rồng cho Đăng 🐉";
      }
      
      // Nếu lời nhắn có dạng "Tên - Lời nhắn" thì tách ra
      var donorName = "Đại gia giấu tên";
      if (cleanMsg.indexOf("-") > -1) {
        var parts = cleanMsg.split("-");
        var potentialName = parts[0].trim();
        if (potentialName.length >= 2 && potentialName.length <= 30) {
          donorName = potentialName;
          cleanMsg = parts.slice(1).join("-").trim() || "Tiếp thêm linh lực rồng 🐉";
        }
      }
      
      // Ghi dòng mới vào Google Sheet:
      // [Thời Gian, Số Tiền, Nội Dung Gốc, Mã Phiên, Tên Đại Gia, Lời Nhắn, Mã Giao Dịch]
      sheet.appendRow([dateStr, amount, rawContent, sessionCode, donorName, cleanMsg, refCode]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Webhook processed" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = (e.parameter && e.parameter.action) || "getDonors";
  var sheet = getOrCreateSheet();
  
  // 1. API kiểm tra trạng thái thanh toán thời gian thực của 1 mã phiên (Real-time Payment Watcher)
  if (action === "checkStatus") {
    var checkCode = (e.parameter && e.parameter.code || "").toUpperCase().trim();
    if (!checkCode) {
      return respondJson({ paid: false, message: "Missing code" });
    }
    
    var rows = sheet.getDataRange().getValues();
    // Quét ngược từ dưới lên (giao dịch mới nhất)
    for (var i = rows.length - 1; i >= 1; i--) {
      var rowCode = String(rows[i][3] || "").toUpperCase();
      var rowContent = String(rows[i][2] || "").toUpperCase();
      if ((rowCode && rowCode.indexOf(checkCode) > -1) || rowContent.indexOf(checkCode) > -1) {
        return respondJson({
          paid: true,
          amount: Number(rows[i][1]) || 0,
          donorName: String(rows[i][4] || "Đại gia giấu tên"),
          message: String(rows[i][5] || ""),
          time: rows[i][0]
        });
      }
    }
    return respondJson({ paid: false });
  }
  
  // 2. API lấy danh sách những người donate gần nhất để hiển thị lên Bảng Vàng
  var limit = Number(e.parameter && e.parameter.limit) || 10;
  var rows = sheet.getDataRange().getValues();
  var donors = [];
  
  for (var i = rows.length - 1; i >= 1 && donors.length < limit; i--) {
    donors.push({
      date: rows[i][0],
      amount: Number(rows[i][1]) || 0,
      name: String(rows[i][4] || "Đại gia giấu tên"),
      message: String(rows[i][5] || "Tiếp linh lực rồng 🐉"),
      timeAgo: calculateTimeAgo(new Date(rows[i][0]))
    });
  }
  
  return respondJson({
    success: true,
    totalDonors: Math.max(0, rows.length - 1),
    donors: donors
  });
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Donations");
  if (!sheet) {
    sheet = ss.insertSheet("Donations");
    sheet.appendRow(["Thời Gian", "Số Tiền (VNĐ)", "Nội Dung Gốc", "Mã Phiên", "Tên Đại Gia", "Lời Nhắn", "Mã GD"]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#fef3c7");
  }
  return sheet;
}

function calculateTimeAgo(date) {
  if (!date || isNaN(date.getTime())) return "Gần đây";
  var diffSec = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Vừa xong";
  if (diffSec < 3600) return Math.floor(diffSec / 60) + " phút trước";
  if (diffSec < 86400) return Math.floor(diffSec / 3600) + " giờ trước";
  return Math.floor(diffSec / 86400) + " ngày trước";
}

function respondJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

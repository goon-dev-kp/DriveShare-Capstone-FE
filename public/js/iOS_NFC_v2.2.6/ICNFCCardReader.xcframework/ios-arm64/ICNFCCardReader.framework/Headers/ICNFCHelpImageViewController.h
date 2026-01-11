//
//  ICNFCHelpImageViewController.h
//  ICNFCCardReader
//
//  Created by Minh Minh iOS on 02/07/2021.
//

#import <UIKit/UIKit.h>
#import "ICNFCBaseViewController.h"


typedef enum : NSUInteger {
    HelpQRCode,     // Hiển thị giao diện hướng dẫn quét mã QR
    HelpMRZCode,    // Hiển thị giao diện hướng dẫn quét mã MRZ
} HelpCardReaderStyle;


NS_ASSUME_NONNULL_BEGIN

@protocol ICNFCHelpImageDelegate <NSObject>

@required
// Phương thức DELEGATE khi thực hiện nhấn vào nút TÔI ĐÃ HIỂU
- (void) icNFCHelpImageGotIt;

// Phương thức DELEGATE khi người dùng xác nhận chọn CÓ khi hiển thị màn hình ĐÓNG SDK
- (void) icNFCHelpImageDismissed;

@end


@interface ICNFCHelpImageViewController : ICNFCBaseViewController

@property (weak, nonatomic) id<ICNFCHelpImageDelegate> helpDelegate;

// Giá trị xác định
// - HelpQRCode: Hiển thị giao diện hướng dẫn quét mã QR
// - HelpMRZCode: Hiển thị giao diện hướng dẫn quét mã MRZ
@property (nonatomic) HelpCardReaderStyle helpCardReaderStyle;


@property (nonatomic, nullable) UIView *viewContentTutorial;

@end

NS_ASSUME_NONNULL_END

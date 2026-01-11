//
//  ICNFCHelpFullScreenVideosViewController.h
//  ICNFCCardReader
//
//  Created by Minh Minh iOS on 22/07/2021.
//

#import <UIKit/UIKit.h>
#import <AVKit/AVKit.h>
#import <AVFoundation/AVFoundation.h>
#import "ICNFCBaseViewController.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ICNFCHelpFullScreenVideosDelegate <NSObject>

@required

/**
 * Phương thức được thực hiện khi người dùng nhấn nút BỎ QUA HƯỚNG DẪN ở màn hình Hướng dẫn
 * → Thực hiện đọc thông tin thẻ căn cước
 */
- (void) icNFCHelpFullScreenVideosGotIt;

@end

@interface ICNFCHelpFullScreenVideosViewController : ICNFCBaseViewController

@property (weak, nonatomic) id<ICNFCHelpFullScreenVideosDelegate> helpDelegate;


@property (nonatomic) BOOL isEnableGotIt;
@property (nonatomic) UIColor *colorEkycPrimaryBackground;
@property (nonatomic) NSString *nameVideoHelpNFC;

@end

NS_ASSUME_NONNULL_END

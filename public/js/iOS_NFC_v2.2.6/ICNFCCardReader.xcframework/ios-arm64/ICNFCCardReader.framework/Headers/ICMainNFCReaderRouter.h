//
//  ICMainNFCReaderRouter.h
//  ICNFCCardReader
//
//  Created by Minh Minh iOS on 02/07/2021.
//  Copyright © 2021 Innovation Center - VNPT IT. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ICMainNFCReaderProtocols.h"
#import "ICMainNFCReaderViewController.h"

API_AVAILABLE(ios(13.0))
@interface ICMainNFCReaderRouter : NSObject<ICMainNFCReaderWireframeProtocol>

@property (nonatomic, weak) ICMainNFCReaderViewController *viewController;

+ (UIViewController *)createModule;

@end

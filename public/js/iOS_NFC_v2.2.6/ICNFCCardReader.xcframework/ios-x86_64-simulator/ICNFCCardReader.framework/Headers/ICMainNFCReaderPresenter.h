//
//  ICMainNFCReaderPresenter.h
//  ICNFCCardReader
//
//  Created by Minh Minh iOS on 02/07/2021.
//  Copyright © 2021 Innovation Center - VNPT IT. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ICMainNFCReaderProtocols.h"

NS_ASSUME_NONNULL_BEGIN

@interface ICMainNFCReaderPresenter : NSObject<ICMainNFCReaderInteractorOutputProtocol, ICMainNFCReaderPresenterProtocol>

@property (nonatomic, weak, nullable) id<ICMainNFCReaderViewProtocol> view;
@property (nonatomic) id<ICMainNFCReaderInteractorInputProtocol> interactor;
@property (nonatomic) id<ICMainNFCReaderWireframeProtocol> router;

- (instancetype)initWithInterface:(id<ICMainNFCReaderViewProtocol>)interface
                       interactor:(id<ICMainNFCReaderInteractorInputProtocol>)interactor
                           router:(id<ICMainNFCReaderWireframeProtocol>)router;

- (void) gotoICPopupWarningWithTitle:(NSString *)title content:(NSString *)content titleButton:(NSString *)titleButton icon:(NSString *)icon lastStep:(ICNFCLastStep)lastStep;

- (void) callApiCreateLinkUploadAvatar:(NSString *)fileName contentType:(NSString *)contentType avatar:(UIImage *)avatar flow:(NSString *)flow;

- (void) callApiUploadAvatarWithUrl:(NSString *)url fileName:(NSString *)fileName contentType:(NSString *)contentType hexKey:(NSString *)hexKey hash:(NSString *)hash formData:(NSDictionary *)formData avatar:(UIImage *)avatar;

- (void) callApiCreateLinkUploadDGs:(NSString *)fileName contentType:(NSString *)contentType dataFile:(NSData *)dataFile flow:(NSString *)flow;

- (void) callApiUploadDGsWithUrl:(NSString *)url fileName:(NSString *)fileName contentType:(NSString *)contentType hexKey:(NSString *)hexKey hash:(NSString *)hash formData:(NSDictionary *)formData dataFile:(NSData *)dataFile;

- (void) callApiUploadAvatarGetHashFileName:(NSString *)fileName title:(NSString *)title description:(NSString *)description avatar:(UIImage *)avatar isForceV1:(BOOL)isForceV1;

- (void) callApiUploadDGsGetHashFileName:(NSString *)fileName title:(NSString *)title description:(NSString *)description dataFile:(NSData *)dataFile isForceV1:(BOOL)isForceV1;

- (void) callApiUploadDataNFCWithHashImage:(NSString *)imageFace hashDGs:(NSString *)hashDGs dataGroups:(NSDictionary<NSString *,NSString *> *)dataGroups mrzs:(NSArray *)mrzs details:(NSDictionary *)details isValidatePostcode:(BOOL)isValidatePostcode isForceV1:(BOOL)isForceV1 flow:(NSString *)flow;

- (void) callApiUploadLogNFC:(NSString *)cardId dob:(NSString *)dob doe:(NSString *)doe path:(NSString *)path retry:(NSInteger)retry sdkLog:(NSString *)sdkLog flow:(NSString *)flow;

- (void) callApiGetPostcodeMatchingPlaceOfOrigin:(NSString *)placeOfOrigin isForceV1:(BOOL)isForceV1;

- (void) callApiGetPostcodeMatchingPlaceOfResidence:(NSString *)placeOfResidence isForceV1:(BOOL)isForceV1;


- (void) resetICNFCSaveData;

- (void) saveClientSession:(NSString *)clientSession;

- (void) saveMRZCodeImage:(UIImage *)image cropedImage:(UIImage *)cropedImage path:(NSURL *)path;

- (void) saveQRCode:(NSString *)qrCode image:(UIImage *)image cropedImage:(UIImage *)cropedImage path:(NSURL *)path;

- (void) saveAvatar:(UIImage *)avatar;

- (void) saveChipAuthentication:(ICNFCAuthenticationStatus)chipAuthentication activeAuthentication:(ICNFCAuthenticationStatus)activeAuthentication;

@end

NS_ASSUME_NONNULL_END
